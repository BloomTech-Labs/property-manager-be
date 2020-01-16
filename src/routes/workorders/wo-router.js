const express = require('express')
const WOController = require('../../controllers/workorders/workorders.js')
const bearerAuth = require('../../lib/bearer-auth')
const requireAuth = require('../../lib/require-auth')
const {requireLandlord} = require('../../middleware')

const Workorders = require('../../models/workorders')

const router = express.Router()

router.use(bearerAuth, requireAuth)

const validateInput = getErrors => (req, res, next) => {
  const errors = getErrors(req.body)

  if (Object.keys(errors).length > 0) {
    res.status(400).json({errors})
  } else {
    next()
  }
}

//#region - READ

  // GET all workorders - based off the user who is logged in
  router.get('/', WOController.readAllByUser)

//#endregion


module.exports = router