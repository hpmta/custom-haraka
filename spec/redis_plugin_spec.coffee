plugin = require '../plugins/redis'
sinon = require 'sinon'
should = require 'should'
redis = require 'redis'

describe 'redis plugin', ->

  describe 'register', ->

    before ->
      plugin.register_hook = sinon.spy()

    it 'should register the hook', ->
      plugin.register()
      should(plugin.register_hook.withArgs('init_master', 'connect_redis').calledOnce).be.true


  describe 'connect_redis', ->

    before ->
      plugin.loginfo = sinon.stub()
      plugin.config = {get: sinon.stub().withArgs('redis.ini').returns(main: {port: 6379, host: 'localhost'})}
      sinon.spy(redis, 'createClient')

    it 'should add redis connection', (done) ->
      server = {notes: {}}
      plugin.connect_redis ((state) ->
        should(server.notes).have.property('redis')
        done()
      ), server

    it 'should create redis connection', (done) ->
      server = {notes: {}}
      plugin.connect_redis ((state) ->
        should(redis.createClient.calledTwice).be.true
        done()
      ), server
