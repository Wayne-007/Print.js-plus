import Modal from './modal'
import Browser from './browser'

// 主要是处理json数据，用于生成表头
export const handleJSONData = ({ data = [], level = 0, params }) => {
  let maxLevel = level + 1  //  标记层级，用于表格合并
  const keys = [] //  最后一级的字段，用于数据渲染
  const keyItems = [] //  和上面基本一样，但是信息更多

  const _resData = data.map((property) => {
    const _item = {
      dataIndex: typeof property === 'object' ? property.dataIndex : property,  //  渲染关键字
      title: typeof property === 'object' ? property.title : property,  //  表头名称
      align: typeof property === 'object' ? property.align : property,  //  表头文字位置
      width: typeof property === 'object' && property.width ? property.width : '',  //  表格所占的宽度，没有设置则计算百分比
      // columnSize: typeof property === 'object' && property.columnSize ? `${property.columnSize};` : `${100 / params.properties.length}%;`,  //  表格所占的宽度，没有设置则计算百分比
      level: level + 1
    }
    if (property.children && property.children.length) {
      _item.colspan = property.children.length
      const childrenObj = handleJSONData({
        data: property.children,
        level: _item.level
      })
      _item.children = childrenObj.data
      maxLevel = Math.max(maxLevel, childrenObj.maxLevel)
      keys.push(...childrenObj.keys)
      keyItems.push(...childrenObj.keyItems)
    } else {
      keys.push(_item.dataIndex)
      keyItems.push(_item)
    }
    return _item
  })

  return {
    data: _resData,
    maxLevel,
    keys,
    keyItems
  }
}

export function addWrapper(htmlData, params) {
  const bodyStyle = 'font-family:' + params.font + ' !important; font-size: ' + params.font_size + ' !important; width:100%;'
  return '<div style="' + bodyStyle + '">' + htmlData + '</div>'
}

export function capitalizePrint(obj) {
  return obj.charAt(0).toUpperCase() + obj.slice(1)
}

export function collectStyles(element, params) {
  const win = document.defaultView || window

  // String variable to hold styling for each element
  let elementStyle = ''

  // Loop over computed styles
  const styles = win.getComputedStyle(element, '')

  for (let key = 0; key < styles.length; key++) {
    // Check if style should be processed
    if (params.targetStyles.indexOf('*') !== -1 || params.targetStyle.indexOf(styles[key]) !== -1 || targetStylesMatch(params.targetStyles, styles[key])) {
      if (styles.getPropertyValue(styles[key])) elementStyle += styles[key] + ':' + styles.getPropertyValue(styles[key]) + ';'
    }
  }

  // Print friendly defaults (deprecated)
  elementStyle += 'max-width: ' + params.maxWidth + 'px !important; font-size: ' + params.font_size + ' !important;'

  return elementStyle
}

function targetStylesMatch(styles, value) {
  for (let i = 0; i < styles.length; i++) {
    if (typeof value === 'object' && value.indexOf(styles[i]) !== -1) return true
  }
  return false
}

export function addHeader(printElement, params) {
  // Create the header container div
  const headerContainer = document.createElement('div')

  // Check if the header is text or raw html
  if (isRawHTML(params.header)) {
    headerContainer.innerHTML = params.header
  } else {
    // Create header element
    const headerElement = document.createElement('h1')

    // Create header text node
    const headerNode = document.createTextNode(params.header)

    // Build and style
    headerElement.appendChild(headerNode)
    headerElement.setAttribute('style', params.headerStyle)
    headerContainer.appendChild(headerElement)
  }

  printElement.insertBefore(headerContainer, printElement.childNodes[0])
}

export function addFooter(printElement, params) {
  // Create the footer container div
  const footerContainer = document.createElement('div')

  // Check if the footer is text or raw html
  if (isRawHTML(params.footer)) {
    footerContainer.innerHTML = params.footer
  } else {
    // Create footer element
    const footerElement = document.createElement('h1')

    // Create footer text node
    const footerNode = document.createTextNode(params.footer)

    // Build and style
    footerElement.appendChild(footerNode)
    footerElement.setAttribute('style', params.footerStyle)
    footerContainer.appendChild(footerElement)
  }

  printElement.insertBefore(footerContainer, printElement.childNodes.lastChild)
}

export function cleanUp(params) {
  // If we are showing a feedback message to user, remove it
  if (params.showModal) Modal.close()

  // Check for a finished loading hook function
  if (params.onLoadingEnd) params.onLoadingEnd()

  // If preloading pdf files, clean blob url
  if (params.showModal || params.onLoadingStart) window.URL.revokeObjectURL(params.printable)

  // Run onPrintDialogClose callback
  let event = 'mouseover'

  if (Browser.isChrome() || Browser.isFirefox()) {
    // Ps.: Firefox will require an extra click in the document to fire the focus event.
    event = 'focus'
  }

  const handler = () => {
    // Make sure the event only happens once.
    window.removeEventListener(event, handler)

    params.onPrintDialogClose()

    // Remove iframe from the DOM
    const iframe = document.getElementById(params.frameId)

    if (iframe) {
      if (params.frameRemoveDelay) {
        setTimeout(() => {
          iframe.remove()
        },
          params.frameRemoveDelay
        )
      } else {
        iframe.remove()
      }
    }
  }

  window.addEventListener(event, handler)
}

export function isRawHTML(raw) {
  const regexHtml = new RegExp('<([A-Za-z][A-Za-z0-9]*)\\b[^>]*>(.*?)</\\1>')
  return regexHtml.test(raw)
}
