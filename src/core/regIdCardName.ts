/**
 * @name regIdCardName
 * @type 正则
 * @description 校验中国身份证姓名（包含少数名族 · 格式，最大长度不超过20位）
 * @version 0.0.22
 * @param {String} name 必填项，身份证姓名
 * @todo 
 * @returns {Boolean} true 或者 false
 * @parameter 鲁宽宽
 * @example
 *  import { regIdCardName } from "@lu-kk/js-utils"
 *  const text = "鲁宽宽";
 *  regIdCardName(text)  // true or false
 */
export function regIdCardName (name: string) {
  if (!name) return false
  let reg = /^[a-zA-Z\u4E00-\u9FA5\uf900-\ufa2d·s]{2,20}$/
  if (reg.test(name)) return true
  return false
}
export default regIdCardName