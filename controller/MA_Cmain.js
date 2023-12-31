const {
  User,
  UserTakeClass,
  Class,
  board,
  map,
  like,
} = require("../models/index");
const bcrypt = require("bcrypt");
const axios = require("axios");
const nodemailer = require("nodemailer");

//카카오 rest api활용
const kakao = {
  clientID: process.env.KAKAO_ID,
  redirectUri: "http://www.clavi.site/auth/kakao/callback",
};

/////////////////////GET///////////////////////

exports.classMain = (req, res) => {
  res.render("MA_classMain");
};

exports.intro = async (req, res) => {
  if (req.session.isLogined) {
    //세션이 있는경우
    const data = await User.findOne({ where: { id: req.session.userId } });
    const myBoard = await board.findAll({ where: { id: req.session.userId } });
    const myClass = await UserTakeClass.findAll({
      where: { userid: req.session.userId },
    }); //유저id 가 가지고 있는 클래스  row 반환
    req.session.img = data.profileImgPath;

    let Classes = [];
    let classToken = [];
    let ClassesId = [];
    let likeArr = [];
    for (const ele of myClass) {
      const myClassName = await Class.findOne({
        where: { ClassId: ele.classClassId }, // 원하는 조건을 지정합니다.
      });
      Classes.push(myClassName.className);
      ClassesId.push(myClassName.ClassId);
      classToken.push(myClassName.token);
    }

    for (const my of myBoard) {
      const cou = await like.count({
        where: { BoardId: my.BoardId },
      });
      likeArr.push(cou);
    }

    console.log("프로필", data);
    res.render("MA_profile", {
      data,
      Classes,
      ClassesId,
      myBoard,
      likeArr,
      classToken,
    });
  } else {
    res.render("intro");
  }
};
//회원가입
exports.join = (req, res) => {
  res.render("MA_join");
};
//로그인
exports.login = async (req, res) => {
  if (req.session.isLogined) {
    //세션이 있는경우
    const data = await User.findOne({ where: { id: req.session.userId } });
    const myBoard = await board.findAll({ where: { id: req.session.userId } });
    const myClass = await UserTakeClass.findAll({
      where: { userid: req.session.userId },
    }); //유저id 가 가지고 있는 클래스  row 반환
    req.session.img = data.profileImgPath;

    let Classes = [];
    let classToken = [];
    let ClassesId = [];
    let likeArr = [];
    for (const ele of myClass) {
      const myClassName = await Class.findOne({
        where: { ClassId: ele.classClassId }, // 원하는 조건을 지정합니다.
      });
      Classes.push(myClassName.className);
      ClassesId.push(myClassName.ClassId);
      classToken.push(myClassName.token);
    }

    for (const my of myBoard) {
      const cou = await like.count({
        where: { BoardId: my.BoardId },
      });
      likeArr.push(cou);
    }

    console.log("프로필", data);
    res.render("MA_profile", {
      data,
      Classes,
      ClassesId,
      myBoard,
      likeArr,
      classToken,
    });
  } else {
    res.render("MA_login");
  }
};
exports.kakao_get_join = (req, res) => {
  res.redirect(
    `https://kauth.kakao.com/oauth/authorize?client_id=${kakao.clientID}&redirect_uri=http://www.clavi.site/auth/kakao/join/callback&response_type=code&scope=profile_nickname,account_email`
  );
};
//카카오 로그인 요청
exports.kakao_get = (req, res) => {
  res.redirect(
    `https://kauth.kakao.com/oauth/authorize?client_id=${kakao.clientID}&redirect_uri=http://www.clavi.site/auth/kakao/login/callback&response_type=code&scope=profile_nickname,account_email`
  );
};
//카카오 회원가입
exports.kakao_join = async (req, res) => {
  try {
    token = await axios({
      method: "POST",
      url: "https://kauth.kakao.com/oauth/token",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      data: {
        grant_type: "authorization_code",
        client_id: kakao.clientID,
        redirectUri: kakao.redirectUri,
        code: req.query.code,
      },
    });
  } catch (err) {
    res.json(err.data);
  }
  let user;
  try {
    // console.log('token:',token);//access정보를 가지고 또 요청해야 정보를 가져올 수 있음.
    user = await axios({
      method: "get",
      url: "https://kapi.kakao.com/v2/user/me",
      headers: {
        Authorization: `Bearer ${token.data.access_token}`,
      },
    });
  } catch (e) {
    res.json(e.data);
  }
  try {
    345678;

    let nickname = user.data.properties.nickname;
    let email = user.data.kakao_account.email;
    const existCheck = await User.findOne({ where: { email } });
    if (existCheck) {
      //이메일 데이터가 존재하면
      // await req.session.destroy();
      req.session.isLogined = true; // 세션생성,
      req.session.userId = existCheck.id;
      req.session.userName = existCheck.name;
      req.session.userType = existCheck.userType;
      //프로필 페이지로 연결
      res.send(
        `<script>alert('이미 가입되었습니다.'); document.location.href='/profile';</script>`
      );
    } else {
      //이메일이 없으면 db생성
      await User.create({
        email,
        name: nickname,
        snsId: "kakao",
        userType: `${req.session.joinType}`,
      });
      const user2 = await User.findOne({ where: { email } });
      req.session.isLogined = true; //db생성후 세션생성
      req.session.userId = user2.id;
      req.session.userName = user2.name;
      req.session.userType = user2.userType;
      //프로필 페이지로 연결
      res.send(
        `<script>alert('회원가입이 완료되었습니다!'); document.location.href='/profile';</script>`
      );
    }
  } catch (error) {
    console.log("카카오 회원가입 error", error);
    res.status(500).json({ result: false });
  }
};

//카카오 로그인
exports.kakao_callback = async (req, res) => {
  try {
    //access토큰을 받기 위한 코드
    token = await axios({
      method: "POST",
      url: "https://kauth.kakao.com/oauth/token",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      data: {
        grant_type: "authorization_code", //특정 스트링
        client_id: kakao.clientID,
        redirectUri: kakao.redirectUri,
        code: req.query.code,
      },
    });
  } catch (err) {
    res.json(err.data);
  }
  let user;
  try {
    // console.log('token:',token);//access정보를 가지고 또 요청해야 정보를 가져올 수 있음.
    user = await axios({
      method: "get",
      url: "https://kapi.kakao.com/v2/user/me",
      headers: {
        Authorization: `Bearer ${token.data.access_token}`,
      },
    });
  } catch (e) {
    res.json(e.data);
  }
  console.log("user: ", user.data);
  try {
    let nickname = user.data.properties.nickname;
    let email = user.data.kakao_account.email;
    const existCheck = await User.findOne({ where: { email } });
    if (existCheck) {
      //이메일 데이터가 존재하면
      // await req.session.destroy();
      req.session.isLogined = true; // 세션생성,
      req.session.userId = existCheck.id;
      req.session.userName = existCheck.name;
      req.session.userType = existCheck.userType;
      //프로필 페이지로 연결
      res.redirect("/profile");
    } else {
      //이메일이 없으면 메인화면으로 이동
      res.send(
        `<script>alert('가입되지 않은 사용자입니다.'); document.location.href='/login';</script>`
      );
    }
  } catch (error) {
    console.log("카카오 회원가입 error", error);
    res.status(500).json({ result: false });
  }
};

//구글 rest api활용
const google = {
  clientID: process.env.GOOGLE_ID,
  client_secret: process.env.CLIENT_SECRET_GOOGLE,
};

//구글 회원가입요청
exports.google_get_join = (req, res) => {
  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${google.clientID}&redirect_uri=http://www.clavi.site/auth/google/join/callback&response_type=code&scope=email profile`
  );
  console.log("로그인 요청 완료");
};

//구글 로그인 요청
exports.google_get = (req, res) => {
  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${google.clientID}&redirect_uri=http://www.clavi.site/auth/google/login/callback&response_type=code&scope=email profile`
  );
  console.log("로그인 요청 완료");
};
//구글회원가입
exports.google_join = async (req, res) => {
  const { code } = req.query;
  console.log("콜백왔다");

  // access_token, refresh_token 등의 구글 토큰 정보 가져오기
  const res1 = await axios({
    method: "POST",
    url: "https://oauth2.googleapis.com/token",
    data: {
      code,
      client_id: google.clientID,
      client_secret: google.client_secret,
      redirect_uri: "http://www.clavi.site/auth/google/join/callback",
      grant_type: "authorization_code",
    },
  });
  const user = await axios({
    method: "get",
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
    headers: {
      Authorization: `Bearer ${res1.data.access_token}`,
    },
  });
  try {
    let name = user.data.name;
    let email = user.data.email;
    const existCheck = await User.findOne({ where: { email } });
    if (existCheck) {
      //이메일 데이터가 존재하면
      req.session.isLogined = true; // 세션생성,
      req.session.userId = existCheck.id;
      req.session.userName = existCheck.name;
      req.session.userType = existCheck.userType;
      //프로필 페이지로 연결
      res.send(
        `<script>alert('이미 가입되었습니다.'); document.location.href='/profile';</script>`
      );
    } else {
      //이메일이 없으면 db생성
      await User.create({
        email,
        name,
        snsId: "google",
        userType: `${req.session.joinType}`,
      });
      const user2 = await User.findOne({ where: { email } });
      // await req.session.destroy();
      req.session.isLogined = true; // 세션생성,
      req.session.userId = user2.id;
      req.session.userName = user2.name;
      req.session.userType = user2.userType;
      //프로필 페이지로 연결
      res.send(
        `<script>alert('회원가입이 완료되었습니다!'); document.location.href='/profile';</script>`
      );
    }
  } catch (error) {
    console.log("구글 회원가입 error", error);
    res.status(500).json({ result: false });
  }
};

//구글 로그인
exports.google_callback = async (req, res) => {
  const { code } = req.query;
  console.log("콜백왔다");

  // access_token, refresh_token 등의 구글 토큰 정보 가져오기
  const res1 = await axios({
    method: "POST",
    url: "https://oauth2.googleapis.com/token",
    data: {
      code,
      client_id: google.clientID,
      client_secret: google.client_secret,
      redirect_uri: "http://www.clavi.site/auth/google/login/callback",
      grant_type: "authorization_code",
    },
  });
  console.log("정보요청했다");
  const user = await axios({
    method: "get",
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
    headers: {
      Authorization: `Bearer ${res1.data.access_token}`,
    },
  });
  try {
    let name = user.data.name;
    let email = user.data.email;
    const existCheck = await User.findOne({ where: { email } });
    if (existCheck) {
      //이메일 데이터가 존재하면
      req.session.isLogined = true; // 세션생성,
      req.session.userId = existCheck.id;
      req.session.userName = existCheck.name;
      req.session.userType = existCheck.userType;
      //프로필 페이지로 연결
      res.redirect("/profile");
    } else {
      //이메일이 없으면 메인화면으로 이동
      res.send(
        `<script>alert('가입되지 않은 사용자입니다.'); document.location.href='/login';</script>`
      );
    }
  } catch (error) {
    console.log("구글 회원가입 error", error);
    res.status(500).json({ result: false });
  }
};

//프로필 페이지
exports.profile = async (req, res) => {
  console.log("프로필 페이지", req.session.userName);
  if (req.session.isLogined) {
    //세션이 있는경우
    const data = await User.findOne({ where: { id: req.session.userId } });
    const myBoard = await board.findAll({ where: { id: req.session.userId } });
    const myClass = await UserTakeClass.findAll({
      where: { userid: req.session.userId },
    }); //유저id 가 가지고 있는 클래스  row 반환
    req.session.img = data.profileImgPath;

    let Classes = [];
    let classToken = [];
    let ClassesId = [];
    let likeArr = [];
    for (const ele of myClass) {
      const myClassName = await Class.findOne({
        where: { ClassId: ele.classClassId }, // 원하는 조건을 지정합니다.
      });
      Classes.push(myClassName.className);
      ClassesId.push(myClassName.ClassId);
      classToken.push(myClassName.token);
    }

    for (const my of myBoard) {
      const cou = await like.count({
        where: { BoardId: my.BoardId },
      });
      likeArr.push(cou);
    }

    console.log("프로필", data);
    res.render("MA_profile", {
      data,
      Classes,
      ClassesId,
      myBoard,
      likeArr,
      classToken,
    });
  } else {
    res.render("MA_login");
  }
};

//로그아웃
exports.logout = (req, res) => {
  console.log(req.session.isLogined);
  req.session.destroy();
  res.redirect("/?msg=logoutsuccess");
};

//밥집찾기
exports.bob = (req, res) => {
  res.render("MA_placeSearch");
};

/////////////////////////POST///////////////////

//인트로
exports.post_main = async (req, res) => {
  delete req.session.joinType;
  console.log(req.body);
  req.session.joinType = req.body.joinType;
  result = req.session.joinType;
  res.json({ result });
};

//회원가입
exports.post_join = async (req, res) => {
  console.log(req.body);
  try {
    const { email, name, phone, pw } = req.body;
    console.log(req.body);
    const existCheck = await User.findOne({ where: { email } });
    if (existCheck) {
      //이메일 데이터가 존재하면
      console.log("이메일 중복");
      res.json({ result: false });
    } else {
      const hashPW = bcryptPassword(pw); //비밀번호 암호화
      await User.create({
        email,
        name,
        phone,
        pw: hashPW,
        userType: `${req.session.joinType}`,
      });
      res.json({ result: true });
    }
  } catch (error) {
    console.log("회원가입 error", error);
    res.status(500).json({ result: false });
  }
};

//로그인
exports.post_login = async (req, res) => {
  console.log("3");
  try {
    const { email, pw } = req.body;
    console.log("4");
    const result = await User.findOne({ where: { email } });
    if (!result) {
      console.log("사용자 존재안함");
      res.json({ result: false, message: "사용자가 존재하지 않습니다." });
    } else {
      const compare = comparePassword(pw, result.pw); //비밀번호 암호화
      if (compare) {
        console.log("로그인 성공");
        // await req.session.destroy();
        req.session.isLogined = true; // 세션생성,
        req.session.userId = result.id;
        req.session.userName = result.name;
        req.session.userType = result.userType;
        res.json({ result: true, userid: req.session.userId });
        // res.redirect('/profile')
      } else {
        console.log("비밀번호 불일치");
        res.json({ result: false, message: "비밀번호가 일치하지 않습니다." });
      }
    }
  } catch (error) {
    console.log("로그인 error", error);
  }
};

//프로필 사진
exports.profileImg = async (req, res) => {
  console.log(req.file);
  const profileImgPath = `/${req.file.path.replace(/\\/g, "/")}`;
  // const profileImgPath = `/${req.file.path.toString()}`; //경로를 string으로 변환
  await User.update({ profileImgPath }, { where: { id: req.session.userId } });
  console.log(req.file); //userfile이 담김
  console.log(profileImgPath);
  req.session.img = profileImgPath;
  res.send(req.file);
};

//탈퇴하기
exports.delete_user = async (req, res) => {
  console.log("탈퇴하러 왔다", req.body.id);
  await User.destroy({ where: { id: req.body.id } });
  req.session.destroy();
  console.log("탈퇴했다");
  res.json({ result: true });
};

//로그아웃
exports.logout = (req, res) => {
  console.log("로그아웃중");
  req.session.destroy();
  res.json({ result: true });
};

//장소찾기
exports.bobSelect = async (req, res) => {
  const { placeId, placeName, placeAddress } = req.body;
  // const place = `${placeId}|${placeName}|${placeAddress}`;
  // console.log(place);
  // await board.update({ place }, { where: { BoardId: "2" } }); //보드 db에 더미데이터 생성하고 실행해야함
  res.json(true);
};

//////////////PATCH//////////////////////
exports.edit_profile = async (req, res) => {
  const { id, email, name, phone } = req.body;
  console.log("수정중", req.body);
  const data = await User.update({ email, name, phone }, { where: { id } });
  console.log("update", data);
  res.json({ result: true, data });
};

//암호화 함수

const salt = 10;
const bcryptPassword = (password) => {
  return bcrypt.hashSync(password, salt);
};

//비교
const comparePassword = (password, dbPassword) => {
  return bcrypt.compareSync(password, dbPassword);
};
