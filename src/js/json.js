import { capitalizePrint, addHeader, addFooter } from './functions'
import Print from './print'

const handleData = ({ data = [], level = 0, params }) => {
  let maxLevel = level + 1
  const keys = []
  const keyItems = []
  const _resData = data.map((property) => {
    const _item = {
      field: typeof property === 'object' ? property.field : property,
      displayName: typeof property === 'object' ? property.displayName : property,
      columnSize: typeof property === 'object' && property.columnSize ? property.columnSize + ';' : 100 / params.properties.length + '%;',
      level: level + 1
    }
    if (property.children && property.children.length) {
      _item.colspan = property.children.length
      const childrenObj = handleData({
        data: property.children,
        level: _item.level
      })
      _item.children = childrenObj.data
      maxLevel = Math.max(maxLevel, childrenObj.maxLevel)
      keys.push(...childrenObj.keys)
      keyItems.push(...childrenObj.keyItems)
    } else {
      keys.push(_item.field)
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
let handleDataRes = {}

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

    handleDataRes = handleData({ data: params.properties, params })
    params.properties = handleDataRes.data

    console.log('handleData===>', handleDataRes)

    // params.properties.map((property) => {
    //   return {
    //     field: typeof property === 'object' ? property.field : property,
    //     displayName: typeof property === 'object' ? property.displayName : property,
    //     columnSize: typeof property === 'object' && property.columnSize ? property.columnSize + ';' : 100 / params.properties.length + '%;',
    //   }
    // })

    // Create a print container element
    params.printableElement = document.createElement('div')

    // Check if we are adding a print header
    if (params.header) {
      addHeader(params.printableElement, params)
    }

    // Build the printable html data
    params.printableElement.innerHTML += jsonToHTML(params)

    // Check if we are adding a print footer
    if (params.footer) {
      addFooter(params.printableElement, params)
    }

    // Print the json data
    Print.send(params, printFrame)
  }
}

function jsonToHTML(params) {
  // Get the row and column data
  const data = params.printable
  const properties = params.properties

  // Create a html table
  let htmlData = '<table style="border-collapse: collapse; width: 100%;">'

  // Check if the header should be repeated
  if (params.repeatTableHeader) {
    htmlData += '<thead>'
  }

  // Add the table header row
  // htmlData += '<tr>'

  const handleHtmlDataObjRes = {}
  const handleHtmlData = (properties, params) => {
    let htmlData = ''
    properties.forEach((element) => {
      if (!!handleHtmlDataObjRes[`level_${element.level}`] === false) {
        handleHtmlDataObjRes[`level_${element.level}`] = ''
      }
      htmlData = `<th style="width:${element.columnSize};${params.gridHeaderStyle}"`
      if (!!element.colspan === true) {
        htmlData += `colspan="${element.colspan}"`
      } else if (element.level < handleDataRes.maxLevel) {
        htmlData += `rowspan="${handleDataRes.maxLevel - element.level + 1}"`
      }
      htmlData += `>${capitalizePrint(element.displayName)}</th>`
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
  // handleHtmlDataRes.forEach((element) => {
  //   htmlData += element
  // })

  // Add the table header columns
  // for (let a = 0; a < properties.length; a++) {
  //   htmlData += '<th style="width:' + properties[a].columnSize + ';' + params.gridHeaderStyle + '">' + capitalizePrint(properties[a].displayName) + '</th>'
  // }

  // Add the closing tag for the table header row
  // htmlData += '</tr>'

  // If the table header is marked as repeated, add the closing tag
  if (params.repeatTableHeader) {
    htmlData += '</thead>'
  }

  // Create the table body
  htmlData += '<tbody>'

  console.log('handleDataRes keys===>', handleDataRes.keys)

  console.log('handleDataRes keyItems===>', handleDataRes.keyItems)

  // Add the table data rows
  // for (let i = 0; i < data.length; i++) {
  //   // Add the row starting tag
  //   htmlData += '<tr>'

  //   // Print selected properties only
  //   for (let n = 0; n < properties.length; n++) {
  //     let stringData = data[i]

  //     // Support nested objects
  //     const property = properties[n].field.split('.')
  //     if (property.length > 1) {
  //       for (let p = 0; p < property.length; p++) {
  //         stringData = stringData[property[p]]
  //       }
  //     } else {
  //       stringData = stringData[properties[n].field]
  //     }

  //     // Add the row contents and styles
  //     htmlData += '<td style="width:' + properties[n].columnSize + params.gridStyle + '">' + stringData + '</td>'
  //   }

  //   // Add the row closing tag
  //   htmlData += '</tr>'
  // }

  for (let i = 0; i < data.length; i++) {
    // Add the row starting tag
    htmlData += '<tr>'
    const _data = data[i]

    // Print selected properties only
    for (let n = 0; n < handleDataRes.keys.length; n++) {
      const _key = handleDataRes.keys[n]

      // Add the row contents and styles
      htmlData += '<td style="width:4;' + params.gridStyle + '">' + _data[_key] + '</td>'
    }

    // Add the row closing tag
    htmlData += '</tr>'
  }

  // Add the table and body closing tags
  htmlData += '</tbody></table>'

  return htmlData
}
