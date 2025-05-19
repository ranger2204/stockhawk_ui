import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterObjectByKey',
})
export class FilterObjectByKeyPipe implements PipeTransform {
  transform(options: any[], key: string, value: string): any[] {
    if(key === undefined || value === undefined || value === '')
        return options
    return options.filter(option => (option[key] as String).toLowerCase().indexOf(value.toLowerCase()) !== -1)
  }
}


@Pipe({
    name: 'filterObjectByExpiry',
})
export class FilterObjectByExpiryPipe implements PipeTransform {
    transform(options: any[], check: boolean): any[] {
        if (check)
            return options
        return options.filter(option => !(Date.parse(option.opt_expiry_date+' 23:59:59') < Date.now()))
    }
}

@Pipe({
    name: 'filterObjectByKeyAgainstList',
    // pure: false
})
export class FilterObjectByKeyAgainstListPipe implements PipeTransform {
  transform(options: any[], key: string, values: string[]): any[] {
    if(key === undefined || key.length === 0 || values === undefined || values.length == 0) {
        console.log("no filtering..")
        console.log(key, values)
        return options
    }
    return options.filter(option => values.indexOf(option[key]) !== -1)
  }
}
