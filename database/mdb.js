module.exports = mPoool => {

  return {
    getCounts(user, countsField) {
      return mPoool.collection('users')
        .findOne({userId: user.id})
        .then(userCounts => userCounts[countsField])
    }
  }
};