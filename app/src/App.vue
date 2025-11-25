<script setup>
import { computed, onMounted, ref, watchEffect } from 'vue'
import Papa from 'papaparse'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)
dayjs.locale('zh-tw')

const SHEET_ID = '1Q8VTiTPLl0EbonoV9_aWVxKR4cwNqtsxxmj4xx58sbo'
const SHEETS = {
  itinerary: 'Itinerary',
  restaurants: 'Restaurants',
}

const itinerary = ref([])
const restaurants = ref([])
const loading = ref(true)
const errorMessage = ref('')
const selectedDiningId = ref('')
const selectedEntryTitle = ref('')
const lastUpdated = ref('')
const currentYear = new Date().getFullYear()
const selectedDateKey = ref('')

const parseSheetDate = (value) => {
  if (!value) return null
  const matched = value.match(/\d{4}\/\d{2}\/\d{2}/)
  const normalized = matched ? matched[0] : value.split(' ')[0]
  if (!normalized) return null
  const parsed = dayjs(normalized, 'YYYY/MM/DD', true)
  return parsed.isValid() ? parsed : null
}

const fallbackDayOrder = (value) => {
  const digits = value?.replace(/\D/g, '')
  return Number(digits || '0')
}

const buildDateKey = (parsedDate, fallback) =>
  parsedDate?.format('YYYY-MM-DD') ?? fallback ?? 'day-unknown'

const buildTimeValue = (timeText, parsedDate) => {
  if (!parsedDate) return Number.MAX_SAFE_INTEGER
  if (!timeText) return parsedDate.endOf('day').valueOf()
  const formatted = timeText.trim()
  const combined = dayjs(
    `${parsedDate.format('YYYY-MM-DD')} ${formatted}`,
    'YYYY-MM-DD HH:mm',
    true
  )
  return combined.isValid()
    ? combined.valueOf()
    : parsedDate.endOf('day').valueOf()
}

const fetchSheet = async (sheetName) => {
  const baseUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`
  const params = new URLSearchParams({
    tqx: 'out:csv',
    sheet: sheetName,
  })

  const response = await fetch(`${baseUrl}?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Google Sheet 回傳 ${response.status}`)
  }
  const csv = await response.text()
  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data ?? [])
      },
      error: (err) => reject(err),
    })
  })
}

const normalizeItinerary = (rows) =>
  rows
    .map((row) => {
      const day = row.Day?.trim() ?? ''
      const date = row.Date?.trim() ?? ''
      const time = row.Time?.trim() ?? ''
      const parsedDate = parseSheetDate(date)
      return {
        day,
        date,
        time,
        title: row.Title?.trim() ?? '',
        desc: row.Desc?.trim() ?? '',
        diningId: row.DiningID?.trim() ?? '',
        dateKey: buildDateKey(parsedDate, day || date),
        dateValue: parsedDate?.valueOf() ?? fallbackDayOrder(day),
        timeValue: buildTimeValue(time, parsedDate),
      }
    })
    .filter((row) => row.day && row.title)

const normalizeRestaurants = (rows) =>
  rows
    .map((row) => ({
      id: row.DiningID?.trim() ?? '',
      name: row.Name?.trim() ?? '',
      tag: row.Tag?.trim() ?? '',
      note: row.Note?.trim() ?? '',
      link: row.Link?.trim() ?? '',
    }))
    .filter((row) => row.id && row.name)

const groupedByDay = computed(() => {
  const map = new Map()
  itinerary.value.forEach((entry) => {
    if (!map.has(entry.dateKey)) {
      map.set(entry.dateKey, {
        key: entry.dateKey,
        day: entry.day,
        date: entry.date,
        dateValue: entry.dateValue,
        entries: [],
      })
    }
    map.get(entry.dateKey).entries.push(entry)
  })

  return [...map.values()]
    .sort((a, b) => a.dateValue - b.dateValue)
    .map((group) => ({
      ...group,
      entries: [...group.entries].sort((a, b) => a.timeValue - b.timeValue),
    }))
})

const activeDay = computed(
  () =>
    groupedByDay.value.find((day) => day.key === selectedDateKey.value) ?? null
)

watchEffect(() => {
  if (!groupedByDay.value.length) {
    selectedDateKey.value = ''
    return
  }
  const stillExists = groupedByDay.value.some(
    (day) => day.key === selectedDateKey.value
  )
  if (!stillExists) {
    selectedDateKey.value = groupedByDay.value[0].key
  }
})

const diningMap = computed(() => {
  const map = {}
  restaurants.value.forEach((item) => {
    if (!map[item.id]) {
      map[item.id] = []
    }
    map[item.id].push(item)
  })
  return map
})

const activeDiningList = computed(() => {
  if (!selectedDiningId.value) return []
  return diningMap.value[selectedDiningId.value] ?? []
})

const selectDay = (key) => {
  selectedDateKey.value = key
}

const openDiningModal = (diningId, title) => {
  selectedDiningId.value = diningId
  selectedEntryTitle.value = title
  document.body.classList.add('no-scroll')
}

const closeDiningModal = () => {
  selectedDiningId.value = ''
  selectedEntryTitle.value = ''
  document.body.classList.remove('no-scroll')
}

const formatDayLabel = (value) => (value ? value.replace('D', 'Day ') : '行程')
const formatTime = (value) => value || '整日活動'
const formatTabDate = (value) => value?.split(' ')?.[0] ?? '日期未填'
const formatWeekday = (value) => {
  const parsed = parseSheetDate(value)
  return parsed ? parsed.format('ddd') : 'Day'
}
const formatDayNumber = (value) => {
  const parsed = parseSheetDate(value)
  return parsed ? parsed.format('DD') : '--'
}

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [itineraryRows, restaurantRows] = await Promise.all([
      fetchSheet(SHEETS.itinerary),
      fetchSheet(SHEETS.restaurants),
    ])
    itinerary.value = normalizeItinerary(itineraryRows)
    restaurants.value = normalizeRestaurants(restaurantRows)
    lastUpdated.value = new Date().toLocaleString('zh-TW', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch (error) {
    console.error(error)
    errorMessage.value =
      '載入 Google Sheet 失敗，請確認試算表是否公開，或稍後再試。'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="app-shell">
    <header class="hero">
      <div>
        <p class="eyebrow">沖繩五日行</p>
        <h1>行程日曆與餐廳攻略</h1>
        <p class="lead">
          自動同步 Google Sheet，適合手機安裝成 PWA App
        </p>
      </div>
      <div class="hero-actions">
        <button type="button" class="ghost" @click="loadData" :disabled="loading">
          重新整理
        </button>
        <a class="primary"
          href="https://docs.google.com/spreadsheets/d/1Q8VTiTPLl0EbonoV9_aWVxKR4cwNqtsxxmj4xx58sbo/edit"
          target="_blank" rel="noreferrer">
          查看主資料表
        </a>
      </div>
    </header>

    <p class="meta" v-if="lastUpdated">
      最後更新：{{ lastUpdated }}
    </p>

    <section v-if="groupedByDay.length" class="inline-calendar" aria-label="選擇日期">
      <div class="calendar-row">
        <button v-for="day in groupedByDay" :key="day.key" type="button" class="calendar-cell"
          :class="{ active: day.key === selectedDateKey }" @click="selectDay(day.key)">
          <span class="weekday">{{ formatWeekday(day.date) }}</span>
          <span class="day-number">{{ formatDayNumber(day.date) }}</span>
          <span class="full-date">{{ formatTabDate(day.date) }}</span>
        </button>
      </div>
    </section>

    <section v-if="loading" class="state state-loading">
      <div class="spinner" aria-hidden="true" />
      <p>行程整理中，請稍候...</p>
    </section>

    <section v-else-if="errorMessage" class="state state-error">
      <p>{{ errorMessage }}</p>
      <button type="button" class="primary" @click="loadData">重新嘗試</button>
    </section>

    <section v-else-if="activeDay" class="day-panel">
      <article class="day-card active">
        <header class="day-header">
          <div>
            <p class="day-label">{{ formatDayLabel(activeDay.day) }}</p>
            <p class="day-date">{{ activeDay.date }}</p>
          </div>
        </header>
        <ol class="timeline">
          <li v-for="entry in activeDay.entries" :key="entry.title + entry.time" class="timeline-item">
            <div class="time">{{ formatTime(entry.time) }}</div>
            <div class="details">
              <p class="title">{{ entry.title }}</p>
              <p v-if="entry.desc" class="desc">{{ entry.desc }}</p>
              <button v-if="entry.diningId" class="link-btn" type="button"
                @click="openDiningModal(entry.diningId, entry.title)">
                查看 {{ entry.diningId }} 推薦
              </button>
            </div>
          </li>
        </ol>
      </article>
    </section>

    <section v-else class="state state-empty">
      <p>目前沒有可顯示的行程，請確認試算表內容。</p>
    </section>

    <footer class="footer">
      <p>© {{ currentYear }} 沖繩行程助理 · 支援 PWA & GitHub Pages</p>
    </footer>

    <div v-if="selectedDiningId" class="modal" role="dialog" aria-modal="true" @click.self="closeDiningModal">
      <div class="modal-card">
        <header>
          <h2>餐廳推薦：{{ selectedEntryTitle }}</h2>
          <button type="button" class="ghost" @click="closeDiningModal">
            關閉
          </button>
        </header>
        <ul v-if="activeDiningList.length" class="dining-list">
          <li v-for="item in activeDiningList" :key="item.name" class="dining-item">
            <div>
              <p class="name">{{ item.name }}</p>
              <p class="tag" v-if="item.tag">{{ item.tag }}</p>
              <p class="note" v-if="item.note">{{ item.note }}</p>
            </div>
            <a v-if="item.link" class="primary small" :href="item.link" target="_blank" rel="noreferrer">
              Google Maps
            </a>
          </li>
        </ul>
        <p v-else class="empty">此 DiningID 尚未設定餐廳</p>
      </div>
    </div>
  </div>
</template>
