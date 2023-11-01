import { capitalizePrint, addHeader, addFooter, handleJSONData, handleThousands } from './functions'
import Print from './print'

export default {
  print: (params, printFrame) => {
    // Check if we received proper data
    if (typeof params.printable !== 'object') {
      throw new Error('Invalid javascript data object (JSON).')
    }

    // Validate repeatTableHeader
    if (typeof params.repeatTableHeader !== 'boolean') {
      throw new Error('Invalid value for repeatTableHeader attribute (JSON).')
    }

    // Validate properties
    if (!params.properties || !Array.isArray(params.properties)) {
      throw new Error('Invalid properties array for your JSON data.')
    }

    // We will format the property objects to keep the JSON api compatible with older releases

    const handleDataRes = handleJSONData({
      data: params.properties,
      params
    })
    params.properties = handleDataRes.data

    console.log('handleData===>', handleDataRes)

    // Create a print container element
    params.printableElement = document.createElement('div')

    // Check if we are adding a print header
    if (params.header) {
      addHeader(params.printableElement, params)
    }

    // Build the printable html data
    params.printableElement.innerHTML += jsonToHTML(params, handleDataRes)

    // Check if we are adding a print footer
    if (params.footer) {
      addFooter(params.printableElement, params)
    }

    // Print the json data
    Print.send(params, printFrame)
  }
}

function jsonToHTML(params, handleDataRes) {
  // Get the row and column data
  const data = params.printable
  const properties = params.properties

  // Create a html table
  let htmlData = '<table style="border-collapse: collapse; width: 100%;">'

  // Check if the header should be repeated
  if (params.repeatTableHeader) {
    htmlData += '<thead>'
  }

  const handleHtmlDataObjRes = {}
  const handleHtmlData = (properties, params) => {
    let htmlData = ''
    properties.forEach((element) => {
      if (!!handleHtmlDataObjRes[`level_${element.level}`] === false) {
        handleHtmlDataObjRes[`level_${element.level}`] = ''
      }
      htmlData = `<th style="width:${element.width || 100 / handleDataRes.keys.length + '%'};${!!element.align === true ? 'text-align:' + element.align : (element.colspan ? 'text-align:center' : '')};${params.gridHeaderStyle}"`
      if (!!element.colspan === true) {
        htmlData += `colspan="${element.colspan}"`
      } else if (element.level < handleDataRes.maxLevel) {
        htmlData += `rowspan="${handleDataRes.maxLevel - element.level + 1}"`
      }
      htmlData += `>${capitalizePrint(element.title)}</th>`
      handleHtmlDataObjRes[`level_${element.level}`] += htmlData
      if (element.children && element.children.length) {
        handleHtmlData(element.children, params)
      }
    })
    return handleHtmlDataObjRes
  }
  const handleHtmlDataRes = handleHtmlData(properties, params)
  console.log('handleHtmlData===>', handleHtmlDataRes)
  for (const key in handleHtmlDataRes) {
    htmlData += `<tr>${handleHtmlDataRes[key]}</tr>`
  }

  // If the table header is marked as repeated, add the closing tag
  if (params.repeatTableHeader) {
    htmlData += '</thead>'
  }

  // Create the table body
  htmlData += '<tbody>'

  // Add the table data rows
  for (let i = 0; i < data.length; i++) {
    // Add the row starting tag
    htmlData += '<tr>'
    const _data = data[i]

    // Print selected properties only
    for (let n = 0; n < handleDataRes.keys.length; n++) {
      const _key = handleDataRes.keys[n]
      const _keyItem = handleDataRes.keyItems[n]

      let _value = _data[_key]
      if (!!_value === false && _value !== 0) { //  防止为null
        _value = ''
      } else if (_keyItem._isThousands === true) {  //  千分位处理（1,000.00）
        _value = handleThousands({
          val: _value
        })
      } else if (_keyItem.customRender) {
        _value = customRender({
          text: _value,
          record: _data,
          index: i
        })
      }

      // Add the row contents and styles
      htmlData += `<td style="width:4;${params.gridStyle}">${_value}</td>`
    }

    // Add the row closing tag
    htmlData += '</tr>'
  }

  // Add the table and body closing tags
  htmlData += '</tbody></table>'

  return htmlData
}
