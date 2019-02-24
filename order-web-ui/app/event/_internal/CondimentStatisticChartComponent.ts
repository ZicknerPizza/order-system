import {Component, ElementRef, Input, OnInit, ViewChild} from "@angular/core";
import {Statistic} from "../../_internal/api/CondimentRestService";

@Component({
    selector: "condimentStatisticChart",
    templateUrl: "./CondimentStatisticChart.html"
})
export class CondimentStatisticChartComponent implements OnInit {
    private static CHART_LEGEND_POSITION = 10;
    private static CHART_OFFSET = 50;
    private static CHART_WIDTH = 730;
    private static CHART_HEIGHT = 80;
    private static MINIMUM_RANGE = 1;

    @ViewChild("statisticCanvas")
    private canvasRef: ElementRef;

    @Input()
    private statistic: Statistic;

    @Input()
    private currentAmount: number;

    @Input()
    private unit: string;

    ngOnInit() {
        let ctx = this.getContext();
        ctx.font = "12px Arial";

        this.drawStatisticContent(ctx, "zu viel", "#d9534f", this.statistic.greater, 20);
        this.drawStatisticContent(ctx, "OK", "#5cb85c", this.statistic.match, 40);
        this.drawStatisticContent(ctx, "zu wenig", "#337ab7", this.statistic.less, 60);
        this.drawLegend(ctx);
    }

    private getContext(): CanvasRenderingContext2D {
        return this.canvasRef.nativeElement.getContext('2d');
    }

    private drawLegend(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";
        ctx.textBaseline = "top";
        ctx.textAlign = "center";
        ctx.lineWidth = 1;

        let [minX, maxX] = this.calculateMinimumAndMaximum();
        let legendY = CondimentStatisticChartComponent.CHART_HEIGHT;
        ctx.beginPath();
        ctx.moveTo(this.condimentStatisticValueToXPosition(minX), legendY);
        ctx.lineTo(this.condimentStatisticValueToXPosition(maxX), legendY);
        ctx.stroke();

        for (let x = minX + this.getStepSize() / 2; x < maxX; x += this.getStepSize()) {
            let imageX = this.condimentStatisticValueToXPosition(x);
            ctx.fillText(x.toString() + " " + this.unit, imageX, legendY);
            ctx.beginPath();
            ctx.moveTo(imageX, legendY - 3);
            ctx.lineTo(imageX, legendY);
            ctx.stroke();

        }
    }

    private drawStatisticContent(ctx: CanvasRenderingContext2D, name: string, color: string, values: Array<number>, valueY: number) {
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(name, CondimentStatisticChartComponent.CHART_LEGEND_POSITION, valueY);

        if (values != undefined) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.moveTo(this.condimentStatisticValueToXPosition(values[0]), valueY);
            ctx.lineTo(this.condimentStatisticValueToXPosition(values[values.length - 1]), valueY);
            ctx.stroke();
            for (let point of values) {
                ctx.beginPath();
                ctx.arc(this.condimentStatisticValueToXPosition(point), valueY, 4, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();
            }
        }
    }

    private condimentStatisticValueToXPosition(staticValue: number) {
        let [minX, maxX] = this.calculateMinimumAndMaximum();
        let positionNormalized = (staticValue - minX) / (maxX - minX);
        return CondimentStatisticChartComponent.CHART_OFFSET + positionNormalized * CondimentStatisticChartComponent.CHART_WIDTH;
    }

    private getStepSize(): number {
        let [minX, maxX] = this.calculateMinimumAndMaximum();
        let stepSize = (maxX - minX) / 5;
        let distance = Math.round(stepSize / 10) * 10;
        if (distance < 10) {
            distance = 10;
        }
        return distance;
    }

    private calculateMinimumAndMaximum(): Array<number> {
        let minX = this.statistic.getMinimum();
        let maxX = this.statistic.getMaximum();

        let diff = maxX - minX;
        if (diff < CondimentStatisticChartComponent.MINIMUM_RANGE) {
            let necessaryExtension = (CondimentStatisticChartComponent.MINIMUM_RANGE - diff) / 2;
            maxX += necessaryExtension;
            minX -= necessaryExtension;
            diff = CondimentStatisticChartComponent.MINIMUM_RANGE;
        }
        let emptySpace = diff * 0.2;
        maxX += emptySpace;
        minX -= emptySpace;

        minX = Math.max(Math.floor(minX / 10) * 10, 0);
        maxX = Math.ceil(maxX / 10) * 10;

        return [minX, maxX];
    }

}
