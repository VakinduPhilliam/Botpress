/*
  The goal of these helpers is to generate SQL queries
  that are valid for both SQLite and Postgres
*/

import moment from 'moment'

const isLite = knex => {
  return knex.client.config.client === 'sqlite3'
}

module.exports = knex => {

  const dateParse = exp => {
    return isLite(knex)
    ? knex.raw(`strftime('%Y-%m-%dT%H:%M:%fZ', ${exp})`)
    : knex.raw(exp)
  }

  const dateFormat = date => {
    const iso = moment(date).toDate().toISOString()
    return dateParse(`'${iso}'`)
  }

  const columnOrDateFormat = colOrDate => {
    const lite = isLite(knex)

    if (colOrDate.sql) {
      return colOrDate.sql
    }

    if (typeof colOrDate === 'string') {
      return lite ? dateParse(colOrDate) : `"${colOrDate}"`
    }

    return dateFormat(colOrDate)
  }

  return {
    isLite: () => isLite(knex),

    // knex's createTableIfNotExists doesn't work with postgres
    // https://github.com/tgriesser/knex/issues/1303
    createTableIfNotExists: (tableName, cb) => {
      return knex.schema.hasTable(tableName)
      .then(exists => {
        if (exists) { return }
        return knex.schema.createTableIfNotExists(tableName, cb)
      })
    },

    date: {
      format: dateFormat,

      now: () => isLite(knex) ? knex.raw("strftime('%Y-%m-%dT%H:%M:%fZ', 'now')") : knex.raw('now()'),

      isBefore: (d1, d2) => {
        d1 = columnOrDateFormat(d1)
        d2 = columnOrDateFormat(d2)

        return knex.raw(d1 + ' < ' + d2)
      },

      isAfter: (d1, d2) => {
        d1 = columnOrDateFormat(d1)
        d2 = columnOrDateFormat(d2)

        return knex.raw(d1 + ' > ' + d2)
      },

      isBetween: (d1, d2, d3) => {
        d1 = columnOrDateFormat(d1)
        d2 = columnOrDateFormat(d2)
        d3 = columnOrDateFormat(d3)

        return knex.raw(`${d1} BETWEEN ${d2} AND ${d3}`)
      },

      isSameDay: (d1, d2) => {
        d1 = columnOrDateFormat(d1)
        d2 = columnOrDateFormat(d2)

        return knex.raw(`date(${d1}) = date(${d2})`)
      },

      hourOfDay: date => {
        date = columnOrDateFormat(date)
        return isLite(knex)
          ? knex.raw(`strftime('%H', ${date})`)
          : knex.raw(`to_char(${date}, 'HH24')`)
      }
    },

    bool: {

      true: () => isLite(knex) ? 1 : true,
      false: () => isLite(knex) ? 0 : false,
      parse: value => isLite(knex) ? !!value : value

    }

  }
}
