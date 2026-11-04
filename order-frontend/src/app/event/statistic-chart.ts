import { afterNextRender, Component, ElementRef, input, viewChild } from '@angular/core';
import { Statistic, StatisticValues } from '../api/models';
import { statisticMaximum, statisticMinimum } from './statistic';

const LEGEND_POSITION = 10;
const OFFSET = 50;
const WIDTH = 730;
const HEIGHT = 80;
const MINIMUM_RANGE = 1;

/**
 * Amount per pizza of all past parties by rating, drawn like in the old frontend.
 */
@Component({
  selector: 'app-statistic-chart',
  template: `
    <b>Erfahrungswerte von allen Events in {{ unit() }}/Pizza:</b><br />
    <canvas #canvas width="800" height="100"></canvas>
  `,
})
export class StatisticChart {
  readonly statistic = input.required<Statistic>();
  readonly unit = input.required<string>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    afterNextRender(() => this.draw());
  }

  private draw(): void {
    const ctx = this.canvas().nativeElement.getContext('2d');
    if (ctx === null) {
      return;
    }
    ctx.font = '12px Arial';
    const statistic = this.statistic();
    this.drawValues(ctx, 'zu viel', '#d9534f', statistic.greater, 20);
    this.drawValues(ctx, 'OK', '#5cb85c', statistic.match, 40);
    this.drawValues(ctx, 'zu wenig', '#337ab7', statistic.less, 60);
    this.drawLegend(ctx);
  }

  private drawLegend(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.lineWidth = 1;

    const [min, max] = this.range();
    ctx.beginPath();
    ctx.moveTo(this.toX(min), HEIGHT);
    ctx.lineTo(this.toX(max), HEIGHT);
    ctx.stroke();

    const step = this.stepSize();
    for (let value = min + step / 2; value < max; value += step) {
      const x = this.toX(value);
      ctx.fillText(`${value} ${this.unit()}`, x, HEIGHT);
      ctx.beginPath();
      ctx.moveTo(x, HEIGHT - 3);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
  }

  private drawValues(
    ctx: CanvasRenderingContext2D,
    name: string,
    color: string,
    values: StatisticValues | null,
    y: number,
  ): void {
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(name, LEGEND_POSITION, y);
    if (values === null) {
      return;
    }
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.moveTo(this.toX(values[0]), y);
    ctx.lineTo(this.toX(values[values.length - 1]), y);
    ctx.stroke();
    for (const value of values) {
      ctx.beginPath();
      ctx.arc(this.toX(value), y, 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  private toX(value: number): number {
    const [min, max] = this.range();
    return OFFSET + ((value - min) / (max - min)) * WIDTH;
  }

  private stepSize(): number {
    const [min, max] = this.range();
    return Math.max(Math.round((max - min) / 5 / 10) * 10, 10);
  }

  /** Rounded to tens, with 20 % space on both sides */
  private range(): [number, number] {
    let min = statisticMinimum(this.statistic());
    let max = statisticMaximum(this.statistic());
    let diff = max - min;
    if (diff < MINIMUM_RANGE) {
      const extension = (MINIMUM_RANGE - diff) / 2;
      max += extension;
      min -= extension;
      diff = MINIMUM_RANGE;
    }
    const emptySpace = diff * 0.2;
    return [
      Math.max(Math.floor((min - emptySpace) / 10) * 10, 0),
      Math.ceil((max + emptySpace) / 10) * 10,
    ];
  }
}
