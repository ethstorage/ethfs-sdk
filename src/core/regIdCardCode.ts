// interface callback {
//   (data?: boolean): void
// }
/**
 * @name regIdCardCode
 * @type 正则
 * @description 校验中国身份证号（包含x）
 * @version 0.0.22
 * @param {String} code 必填项，身份证号
 * @todo 
 * @returns {Boolean} true 或者 false
 * @parameter 41072219940212543x
 * @example
 *  import { regIdCardCode } from "@lu-kk/js-utils"
 *  const code = "41072219940212543x";
 *  regIdCardCode(code)  // true or false
 */
export function regIdCardCode (code: string | number) {
  if (!code) return false
  let reg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
  if (reg.test(String(code))) return true
  return false
}
export default regIdCardCode