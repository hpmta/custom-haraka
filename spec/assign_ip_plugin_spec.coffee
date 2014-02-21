plugin = require '../plugins/assign_ip'
redis = require('redis').createClient()
sinon = require 'sinon'
should = require 'should'

describe 'assign IP plugin', ->

  describe 'register', ->

    before ->
      plugin.register_hook = sinon.spy()

    it 'should register get_mx hook', ->
      plugin.register()
      should(plugin.register_hook.firstCall.args).be.eql(['get_mx', 'assign_ip_hook'])

  describe 'ip_pool', ->

    describe 'normal scenario', ->
      before ->
        redis.set "client_ip:1111", JSON.stringify(['10.0.0.1', '10.0.0.2', '10.0.0.2'])
        plugin.server = {notes: {redis: redis}}

      it 'should return the client ip pool from redis', (done) ->
        plugin.ip_pool((
          (err, ip_pool) ->
            should(ip_pool).be.eql(['10.0.0.1', '10.0.0.2', '10.0.0.2'])
            done()
          ),1111)

      after ->
        redis.del "client_ip:1111"

    describe 'no client IP set', ->
      before ->
        redis.set "fallback_ip_pool", JSON.stringify(['10.0.0.4'])
        plugin.server = {notes: {redis: redis}}

      it 'should return the fallback ip pool from redis', (done) ->
        plugin.ip_pool((
          (err, ip_pool) ->
            should(ip_pool).be.eql(['10.0.0.4'])
            done()
          ),1111)

      after ->
        redis.del "fallback_ip_pool"

    describe 'no client IP set and no fallback', ->
      before ->
        plugin.server = {notes: {redis: redis}}
      it 'should return error', (done) ->
        plugin.ip_pool((
          (err, ip_pool) ->
            should(ip_pool).be.undefined
            should(err).be.eql('no IP address available')
            done()
          ),1111)

  describe 'assign_ip', ->
    before ->
      plugin.outbound = {lookup_mx: ((domain, next) ->
        next(null, [{exchange: 'smtp1', priority: 40}, {exchange: 'smtp2', priority: 20}])
      )}
    it 'should add ip to MXs', (done) ->
      plugin.assign_ip ((retval, mxs) ->
        mxs.forEach (mx) ->
          should(mx.bind).be.eql('10.0.0.1')
        done()
      ), 'gmail.com', '10.0.0.1'

  describe 'assign_ip_hook', ->
    before ->
      redis.set "client_ip:1111", JSON.stringify(['10.0.0.1', '10.0.0.2', '10.0.0.2'])
      plugin.server = {notes: {redis: redis}}
      plugin.outbound = {lookup_mx: ((domain, next) ->
        next(null, [{exchange: 'smtp1', priority: 40}, {exchange: 'smtp2', priority: 20}])
      )}
    it 'should add assigned_ip to notes', (done) ->
      hmail = {todo: {notes: {clientId: 1111}}}
      plugin.assign_ip_hook ((retval,mxs) ->
        should(hmail.todo.notes.assigned_ip == '10.0.0.1' || hmail.todo.notes.assigned_ip == '10.0.0.2').be.true
        done()
      ), hmail, 'gmail.com'
    after ->
      redis.del "client_ip:1111"


