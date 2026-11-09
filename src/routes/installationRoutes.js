'use strict'

import Router from 'express'

import installationController from '../services/installationController.js'


Router.get('/api/installation/status', installationController.Staus())


Router.post('/api/installation/install',installationController.install())