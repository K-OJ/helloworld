const express = require('express')
const router = express.Router()

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' })
  }

  // Demo credentials
  if (username === '111' && password === '111') {
    return res.json({ success: true, message: '로그인 성공' })
  }

  return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' })
})

module.exports = router
