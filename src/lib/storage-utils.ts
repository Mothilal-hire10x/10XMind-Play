export async function getStorageInfo() {
  const keys = await window.spark.kv.keys()
  const info: Record<string, any> = {}
  
  for (const key of keys) {
    const value = await window.spark.kv.get(key)
    info[key] = {
      type: Array.isArray(value) ? 'array' : typeof value,
      size: JSON.stringify(value).length,
      itemCount: Array.isArray(value) ? value.length : Object.keys(value || {}).length,
      preview: Array.isArray(value) 
        ? `Array[${value.length}]` 
        : typeof value === 'object' 
          ? `Object{${Object.keys(value || {}).length} keys}` 
          : String(value).substring(0, 50)
    }
  }
  
  return info
}

export async function exportAllData() {
  const keys = await window.spark.kv.keys()
  const allData: Record<string, any> = {}
  
  for (const key of keys) {
    allData[key] = await window.spark.kv.get(key)
  }
  
  return allData
}

export function downloadJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
