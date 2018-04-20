const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');


const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}){
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || '');//should be number or string
    return this;
}

mongoose.Query.prototype.exec = async function(){
    
    if(!this.useCache){
        return await exec.apply(this, arguments);
    }
    //copy all property from an object.
    var key = JSON.stringify(
        Object.assign({}, this.getQuery(), {
        collection:this.mongooseCollection.name
    }));

    //do we have any cache data in redis related to this query
    const cachedValue = await client.hget(this.hashKey, key);

    //if yes, then respond to the request right away and return
    if(cachedValue){
      console.log('serving from cache');
      //this is the query that is being executed
      const doc = JSON.parse(cachedValue);
      console.log('doc = ' + doc);
      return Array.isArray(doc) 
        ? doc.map(d => this.model(d))
        : new this.model(JSON.parse(cachedValue));  //creating a new mongo document. this is like n-> new Blog{title:'hi', content:'some content'}
    }

    //if no, we need to respond to request and update our cache to store the data
    console.log('serving from mongo');
      
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result));
    client.expire(this.hashKey, 10);
    return result;

};

module.exports = {
    clearHash(hashKey){
        client.del(JSON.stringify(hashKey));
    }
}