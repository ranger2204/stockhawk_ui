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

import { AnalyticsComponent } from './components/analytics/analytics.component';
import { VirtualMarketComponent } from './components/virtual-market/virtual-market.component';
import { HoldingsComponent } from './components/holdings/holdings.component';
import { DialogNewPF } from './components/virtual-market/virtual-market.component';
import { PortfolioService } from './services/portfolio.service';
import { StockService } from './services/stock.service';

import { Investment } from './models/Investment'

@NgModule({
  declarations: [
    AppComponent,
    AnalyticsComponent,
    VirtualMarketComponent,
    HoldingsComponent,
    DialogNewPF
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    
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
    MatDialogModule
  ],
  providers: [
    PortfolioService,
    StockService,
    Investment
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
