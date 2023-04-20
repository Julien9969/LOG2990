import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LimitedTimeSelectionComponent } from '@app/components/limited-time-selection/limited-time-selection.component';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    constructor(private readonly dialog: MatDialog) {}

    openDialog(): void {
        this.dialog.closeAll();
        this.dialog.open(LimitedTimeSelectionComponent, { closeOnNavigation: true, disableClose: true, autoFocus: false });
    }
}
