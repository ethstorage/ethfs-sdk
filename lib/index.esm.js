function regIdCardName(name) {
  if (!name) return false;
  let reg = /^[a-zA-Z\u4E00-\u9FA5\uf900-\ufa2d·s]{2,20}$/;
  if (reg.test(name)) return true;
  return false;
}

function regIdCardCode(code) {
  if (!code) return false;
  let reg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  if (reg.test(String(code))) return true;
  return false;
}

var index = {
  regIdCardName,
  regIdCardCode
};

export { index as default, regIdCardCode, regIdCardName };
