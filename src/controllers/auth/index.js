const R = require('ramda')
const User = require('../../models/user')
const {firebase, fireAdmin} = require('../../lib/firebase')
const jwt = require('../../lib/jwt')

async function createUser(req, res) {
  const {email, password, type} = req.body

  try {
    //set landlord claim to false on default
    const claimObject = {landlord: false}

    //change landlord claim to true if type = landlord
    if (type === 'landlord') {
      claimObject.landlord = true
    }

    // Create the user
    const {user} = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)

    if (!user) {
      return res.status(400).json({message: 'Account not created'})
    }

    //get uid from the user variable above, set custom claim
    await fireAdmin.auth().setCustomUserClaims(user.uid, claimObject)

    //get current user's id token, refresh it due to newly added claims
    const token = await firebase.auth().currentUser.getIdToken(true)

    res.status(201).json({
      token,
      user: {
        type,
        email,
      },
    })
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      return res.status(400).json({message: 'Email is already used'})
    }

    // TODO: Come back and address additional issues from firebase
    res.status(500).json(err)
  }
}

async function login(req, res) {
  const {email, password} = req.body

  try {
    /*
     * Firebase auth does some magical stuff here.
     * If the users login info is correct, it sets the current user on the
     * global firebase application instance that can be retrieved with
     * firebase.auth().currentUser
     * */
    await firebase.auth().signInWithEmailAndPassword(email, password)

    //updated version
    // const token = await firebase.auth().currentUser.getIdToken()

    const foundUser = await User.findByEmail(email)

    const user = R.pick(['type', 'email', 'firstName', 'lastName'], foundUser)

    const token = jwt.signToken(user)

    // console.log(await fireAdmin.auth().createCustomToken())

    res.status(200).json({token, user})
  } catch (err) {
    console.log(err)
    res.status(401).json({
      error: 'Invalid credentials',
    })
  }
}

module.exports = {
  createUser,
  login,
}
