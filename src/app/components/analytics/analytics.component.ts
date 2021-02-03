import { Component, OnInit } from '@angular/core';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.sass']
})
export class AnalyticsComponent implements OnInit {

  stockListControl = new FormControl()
  stockList = ['Federal Bank', 'FirstSource Solutions']

  constructor() { }

  ngOnInit(): void {
  }

}
