plugin = require '../plugins/add_message_info'
sinon = require 'sinon'
should = require 'should'


describe 'add message info plugin', ->

  describe 'register', ->

    before ->
      plugin.register_hook = sinon.spy()

    it 'should register the hook', ->
      plugin.register()
      should(plugin.register_hook.withArgs('data_post', 'add_info').calledOnce).be.true

  describe 'add_info', ->

    describe 'with X-Mailee-clientId and X-Mailee-deliveryToken headers', ->

      info = sinon.stub()
      info.withArgs("X-Mailee-clientId").returns("1234")
      info.withArgs("X-Mailee-deliveryToken").returns("5678")
      connection = {transaction: {header: {get: info}, notes: {}}}

      it 'should add clientId to transaction notes', (done) ->
        plugin.add_info (() ->
          should(connection.transaction.notes.clientId).eql("1234")
          done()
        ), connection

      it 'should add deliveryToken to transaction notes', (done) ->
        plugin.add_info (() ->
          should(connection.transaction.notes.deliveryToken).eql("5678")
          done()
        ), connection

    describe 'without headers', ->
      plugin.DENY = 901
      info = sinon.stub()
      info.withArgs("X-Mailee-clientId").returns(null)
      info.withArgs("X-Mailee-deliveryToken").returns(null)
      connection = {transaction: {header: {get: info}, notes: {}}}

      it 'should deny message unless X-Mailee-clientId present', (done) ->
        plugin.add_info ((retval, msg) ->
          should(retval).eql(plugin.DENY)
          should(msg).eql("Your message must contain header X-Mailee-clientId")
          done()
        ), connection


      it 'should deny message unless X-Mailee-deliveryToken present', (done) ->
        info.withArgs("X-Mailee-clientId").returns("1234")
        plugin.add_info ((retval, msg) ->
          should(retval).eql(plugin.DENY)
          should(msg).eql("Your message must contain header X-Mailee-deliveryToken")
          done()
        ), connection
