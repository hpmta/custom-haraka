plugin = require '../plugins/custom_logs'
sinon = require 'sinon'
should = require 'should'
util = require 'util'


describe 'custom logs plugin', ->

  describe 'register', ->

    before ->
      plugin.register_hook = sinon.spy()

    it 'should register queue hook', ->
      plugin.register()
      should(plugin.register_hook.firstCall.args).be.eql(['queue_outbound', 'processed_hook'])

    it 'should register bounce hook', ->
      plugin.register()
      should(plugin.register_hook.secondCall.args).be.eql(['bounce', 'bounce_hook'])

    it 'should register deferred hook', ->
      plugin.register()
      should(plugin.register_hook.thirdCall.args).be.eql(['deferred', 'deferred_hook'])

  describe 'write_log', ->
    hmail = {transaction: {rcpt_to: [{original: "<john@mailee.me>", host: "mailee.me"}], notes:{deliveryToken: "1234", clientId: "5678"}}}
    plugin.lognotice = sinon.spy()
    describe 'with no extra information', ->
      it 'should log event type', (done) ->
        plugin.write_log (() ->
          logged = JSON.parse(plugin.lognotice.lastCall.args[0])
          done()
        ), hmail, null, 'test'
      it 'should log timestamp', (done) ->
        plugin.write_log (() ->
          logged = JSON.parse(plugin.lognotice.lastCall.args[0])
          should(logged.timestamp).be.ok
          done()
        ), hmail, null, 'test'
      it 'should log delivery', (done) ->
        plugin.write_log (() ->
          logged = JSON.parse(plugin.lognotice.lastCall.args[0])
          should(logged.delivery).eql('1234')
          done()
        ), hmail, null, 'test'
      it 'should log client', (done) ->
        plugin.write_log (() ->
          logged = JSON.parse(plugin.lognotice.lastCall.args[0])
          should(logged.client).eql('5678')
          done()
        ), hmail, null, 'test'
      it 'should log email', (done) ->
        plugin.write_log (() ->
          logged = JSON.parse(plugin.lognotice.lastCall.args[0])
          should(logged.email).eql('<john@mailee.me>')
          done()
        ), hmail, null, 'test'
      it 'should log host', (done) ->
        plugin.write_log (() ->
          logged = JSON.parse(plugin.lognotice.lastCall.args[0])
          should(logged.host).eql('mailee.me')
          done()
        ), hmail, null, 'test'
      it 'should log uuid', (done) ->
        hmail.todo.uuid = '1246A6DF-479D-400D-AC35-13BC98CBE17C.1'
        plugin.write_log (() ->
          logged = JSON.parse(plugin.lognotice.lastCall.args[0])
          should(logged.uuid).eql('1246A6DF-479D-400D-AC35-13BC98CBE17C.1')
          done()
        ), hmail, null, 'test'
    #describe 'with assigned_ip information', ->
      #hmail.transaction.notes.ip = '127.0.0.1'
      #it 'should log ip', (done) ->
        #plugin.write_log (() ->
          #logged = JSON.parse(plugin.lognotice.lastCall.args[0])
          #should(logged.assigned_ip).eql('127.0.0.1')
          #done()
        #), hmail, null, 'test'

    describe 'bounce event', ->
      hmail = {todo: {rcpt_to: [{original: "<john@mailee.me>", host: "mailee.me"}], notes:{deliveryToken: "1234", clientId: "5678"}}}
      it 'should log err', (done) ->
        plugin.write_log (() ->
          logged = JSON.parse(plugin.lognotice.lastCall.args[0])
          should(logged.err).eql('something went wrong')
          done()
        ), hmail, 'something went wrong', 'bounce'
