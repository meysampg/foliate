import GLib from 'gi://GLib'
import Gio from 'gi://Gio'
import { gettext as _ } from 'gettext'

const makeLocale = locale => {
    try { return new Intl.Locale(locale) }
    catch (e) { return null }
}

const glibcLocale = str => makeLocale(
    str === 'C' ? 'en' : str.split('.')[0].replace('_', '-'))

const getHourCycle = () => {
    try {
        const settings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface' })
        return settings.get_string('clock-format') === '24h' ? 'h23' : 'h12'
    } catch (e) {
        console.debug(e)
    }
}

const hourCycle = getHourCycle()

export const locales = GLib.get_language_names()
    .map(glibcLocale).filter(x => x)
    .map(locale => new Intl.Locale(locale, { hourCycle }))

const percentFormat = new Intl.NumberFormat(locales, { style: 'percent' })
export const percent = x => percentFormat.format(x)

const listFormat = new Intl.ListFormat(locales, { style: 'short', type: 'conjunction' })
export const list = x => x ? listFormat.format(x) : ''

export const date = (str, showTime = false) => {
    if (!str) return ''
    const isBCE = str.startsWith('-')
    const split = str.split('-').filter(x => x)
    const yearOnly = split.length === 1
    const yearMonthOnly = split.length === 2
    const date = yearOnly
        // this is needed because dates like `new Date("100")` is invalid
        ? new Date(Date.UTC((isBCE ? '-' : '') + split[0]))
        : new Date(str)

    // fallback when failed to parse date
    if (isNaN(date)) return str

    const options = yearOnly
        ? { year: 'numeric' }
        : yearMonthOnly
            ? { year: 'numeric', month: 'long' }
            : showTime
                ? { year: 'numeric', month: 'long', day: 'numeric',
                    hour: 'numeric', minute: 'numeric' }
                : { year: 'numeric', month: 'long', day: 'numeric' }

    if (isBCE) options.era =  'short'
    return new Intl.DateTimeFormat(locales, options).format(date)
}

const getRegionEmoji = code => {
    if (!code || code.length !== 2) return ''
    return String.fromCodePoint(
        ...Array.from(code.toUpperCase()).map(x => 127397 + x.charCodeAt()))
}
const displayName = new Intl.DisplayNames(locales, { type: 'language' })
export const language = code => {
    if (!code) return ''
    try {
        const locale = new Intl.Locale(code)
        const { language, region } = locale
        const name = displayName.of(language)
        if (region) {
            const emoji = getRegionEmoji(region)
            return `${emoji ? `${emoji} ` : '' }${name}`
        } else return name
    } catch {
        return ''
    }
}

const minuteFormat = new Intl.NumberFormat(locales, { style: 'unit', unit: 'minute' })
const hourFormat = new Intl.NumberFormat(locales, { style: 'unit', unit: 'hour' })
export const duration = minutes => minutes < 60
    ? minuteFormat.format(Math.round(minutes))
    : hourFormat.format((minutes / 60).toFixed(1))

export const mime = mime => mime ? Gio.content_type_get_description(mime) : ''

export const vprintf = imports.format.vprintf
export const total = n => vprintf(_('of %d'), [n])
