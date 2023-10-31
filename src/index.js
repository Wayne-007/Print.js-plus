import './sass/index.scss'
import print from './js/init'

const printJSPlus = print.init

if (typeof window !== 'undefined') {
  window.printJS = printJSPlus
}

export default printJSPlus
