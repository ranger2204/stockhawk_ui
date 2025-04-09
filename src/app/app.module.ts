import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatListModule} from '@angular/material/list';
import {MatSortModule} from '@angular/material/sort';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSliderModule} from '@angular/material/slider';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

import { AnalyticsComponent } from './components/analytics/analytics.component';
import { VirtualMarketComponent } from './components/virtual-market/virtual-market.component';
import { HoldingsComponent } from './components/holdings/holdings.component';
import { DialogNewPF } from './components/virtual-market/virtual-market.component';
import { PortfolioService } from './services/portfolio.service';
import { StockService } from './services/stock.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { ToastrModule } from 'ngx-toastr'

import { Investment } from './models/Investment'

import { FilterPipe } from './pipes/filter.pipe';
import { FilterObjectByKeyPipe, FilterObjectByExpiryPipe, FilterObjectByKeyAgainstListPipe } from './components/options/pipes/filterPipe';
import { OptionsComponent } from './components/options/options.component'; 


@NgModule({
  declarations: [
    AppComponent,
    AnalyticsComponent,
    VirtualMarketComponent,
    HoldingsComponent,
    DialogNewPF,
    FilterPipe,
    OptionsComponent,
    FilterObjectByKeyPipe,
    FilterObjectByExpiryPipe,
    FilterObjectByKeyAgainstListPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,

    MatSortModule,
    MatCheckboxModule,
    MatListModule,
    MatGridListModule,
    MatSelectModule,
    MatToolbarModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatIconModule,
    MatFormFieldModule,
    MatTableModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatButtonToggleModule,
    MatPaginatorModule,
    MatSliderModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    ToastrModule.forRoot({
      maxOpened: 8
    })
  ],
  providers: [
    PortfolioService,
    StockService,
    Investment
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
