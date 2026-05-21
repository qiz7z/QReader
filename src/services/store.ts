/**
 * 纯内存 + IPC JSON 文件存储，替代不稳定的 IndexedDB
 * 数据在内存中操作，定期同步到本地 JSON 文件
 */
var data: Record<string, any> = {}
var dirty = false
var saveTimer: any = null

function getApi() {
  return (typeof window !== 'undefined' ? (window as any).electronAPI : null) as any
}

export async function initStore() {
  var api = getApi()
  if (api?.storeLoad) {
    try { data = await api.storeLoad(); if (!data) data = {} } catch(e) { data = {} }
  }
  console.log('[Store] Loaded, tables:', Object.keys(data))
}

function markDirty() {
  dirty = true
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(function() { flush() }, 200)
}

async function flush() {
  if (!dirty) return
  dirty = false
  saveTimer = null
  var api = getApi()
  if (api?.storeSave) {
    try {
      // 先序列化成字符串再 IPC，彻底避免 DataCloneError
      await api.storeSave(JSON.stringify(data))
    } catch(_){}
  }
}

function ensure(table: string) {
  if (!data[table]) data[table] = []
  return data[table]
}

// ====== 公开 API，接口与原来一致 ======

export var store = {
  table: function(table: string) {
    return {
      get: function(id: string) {
        var arr = ensure(table)
        for (var i = 0; i < arr.length; i++) { if (arr[i].id === id || arr[i].bookId === id || arr[i].key === id) return arr[i] }
        return undefined
      },

      put: function(item: any) {
        var arr = ensure(table)
        var id = item.id || item.bookId || item.key
        for (var i = 0; i < arr.length; i++) {
          var key = arr[i].id || arr[i].bookId || arr[i].key
          if (key === id) { arr[i] = item; markDirty(); return }
        }
        arr.push(item)
        markDirty()
      },

      add: function(item: any): number {
        var arr = ensure(table)
        var id = arr.length > 0 ? Math.max.apply(null, arr.map(function(x: any) { return typeof x.id === 'number' ? x.id : 0 })) + 1 : 1
        var obj = Object.assign({}, item, { id: id })
        arr.push(obj)
        markDirty()
        return id
      },

      delete: function(id: string) {
        var arr = ensure(table)
        for (var i = 0; i < arr.length; i++) {
          var key = arr[i].id || arr[i].bookId || arr[i].key
          if (key === id) { arr.splice(i, 1); markDirty(); return }
        }
      },

      where: function(field: string) {
        var arr = ensure(table)
        return {
          equals: function(val: any) {
            var result = []
            for (var i = 0; i < arr.length; i++) { if (arr[i][field] === val) result.push(arr[i]) }
            return {
              delete: function() { /* handled by outer delete */ },
              sortBy: function(f: string) {
                result.sort(function(a: any, b: any) { return (a[f]||0) - (b[f]||0) })
                return result
              },
            }
          },
        }
      },

      toArray: function() {
        return ensure(table).slice()
      },

      orderBy: function(field: string) {
        var arr = ensure(table).slice()
        arr.sort(function(a: any, b: any) { return (a[field]||0) - (b[field]||0) })
        return {
          reverse: function() { arr.reverse(); return arr; },
          toArray: function() { return arr; },
          offset: function(o: number) {
            return { limit: function(l: number) { return arr.slice(o, o+l); } }
          },
          limit: function(l: number) { return arr.slice(0, l); }
        }
      },

      count: function() {
        return ensure(table).length
      },

      clear: function() {
        data[table] = []
        markDirty()
      },

      update: function(id: string, updates: any) {
        var arr = ensure(table)
        for (var i = 0; i < arr.length; i++) {
          if (arr[i].id === id) { Object.assign(arr[i], updates); markDirty(); return }
        }
      },
    }
  },

  transaction: function(_mode: string, _tables: string[], fn: Function) {
    return fn()
  },

  tables: [],

  // 清除所有数据
  clearAll: function() {
    data = {}
    markDirty()
  },

  // 立即保存
  flush: flush,
}

export async function closeStore() {
  await flush()
}
