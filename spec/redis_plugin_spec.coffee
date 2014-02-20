redis = require '../plugins/redis'
sinon = require 'sinon'
stub = sinon.stub()
should = require 'should'
util = require 'util'
redis_package = require 'redis'

describe 'Redis Plugin', ->

  describe 'register', ->

    before ->
      redis.register_hook = sinon.spy()

    it 'should register the hook', ->
      redis.register()
      should(redis.register_hook.withArgs('init_master', 'connect_redis').calledOnce).be.true


  describe 'connect_redis', ->

    before ->
      redis.loginfo = stub
      redis.config = {get: stub.withArgs('redis.ini').returns(main: {port: 6379, host: 'localhost'})}
      sinon.spy(redis_package, 'createClient')

    it 'should add redis connection', (done) ->
      server = {notes: {}}
      redis.connect_redis ((state) ->
        should(server.notes).have.property('redis')
        done()
      ), server

    it 'should create redis connection', (done) ->
      server = {notes: {}}
      redis.connect_redis ((state) ->
        should(redis_package.createClient.calledTwice).be.true
        done()
      ), server
