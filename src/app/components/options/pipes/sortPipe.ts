import { Pipe, PipeTransform } from '@angular/core';
import { attr } from 'highcharts';

@Pipe({
    name: 'sort',
})
export class OptionSortPipe implements PipeTransform {
  transform(options: any[], attrib: string, sortOrder: boolean): any[] {
    let order = sortOrder?1:-1
    if(attrib === undefined || attrib == '')
        return options
    if (attrib === 'change') {
      options.forEach(option => {
        option.delta = option.opt_last_price_live - option.opt_last_price
      })
      options.sort((a: any, b: any) => {
        return order*(a.delta - b.delta)
      })
    }

    if (attrib === 'date') {
      options.sort((a, b) => {
        return order*(b.opt_id - a.opt_id)
      })
    }

    if (attrib === 'symbol') {
      options.sort((a, b) => {
        return order*(b.opt_symbol.localeCompare(a.opt_symbol))
      })
    }

    if (attrib === 'price') {
      options.sort((a, b) => {
        return order*(b.opt_last_price_live - a.opt_last_price_live)
      })
    }

    if (attrib == 'sell_date') {
      options.sort((a, b) => {
        return b.sell_date - a.sell_date
      })
    }

    return options
    // return options.filter(option => (option[key] as String).toLowerCase().indexOf(value.toLowerCase()) !== -1)
  }
}

