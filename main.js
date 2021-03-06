window.addEventListener('load', () => {
    new Histogram();
});

class Histogram {

    constructor() {
        // Get elements
        this.container = document.getElementById('histogram');
        this.titleInput = document.getElementById('histogram-title');
        this.xAxisInput = document.getElementById('histogram-x-axis');
        this.yAxisInput = document.getElementById('histogram-y-axis');
        this.yValuesInput = document.getElementById('histogram-y-values');
        this.binInput = document.getElementById('histogram-bin');
        this.chartContainer = document.getElementById('histogram-chart-container');
        this.downloadButton = document.getElementById('histogram-download');

        // Create chart
        this.chart = d3.select('#histogram-chart');
        this.chartTitle = d3.select('#histogram-chart-title');
        this.chartXAxis = d3.select('#histogram-chart-x-axis');
        this.chartYAxis = d3.select('#histogram-chart-y-axis');
        this.chartXTicks = d3.select('#histogram-chart-x-ticks');
        this.chartYTicks = d3.select('#histogram-chart-y-ticks');
        this.chartBars = d3.select('#histogram-chart-bars');

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set margins 
        this.margin = {
            bottom: 40,
            left: 40,
            right: 20,
            top: 50,
        };

        // Bind listeners
        this.update = this.update.bind(this);
        this.titleInput.addEventListener('input', this.update);
        this.xAxisInput.addEventListener('input', this.update);
        this.yAxisInput.addEventListener('input', this.update);
        this.yValuesInput.addEventListener('input', this.update);
        this.binInput.addEventListener('input', this.update);
        this.downloadButton.addEventListener('click', this.download.bind(this));
        window.addEventListener('resize', this.update);

        // Run for first render
        this.update();
    }

    update() {
        // Get values
        const values = this.yValuesInput.value.split(',')
            .map(value => parseInt(value))
            .filter(value => !isNaN(value));
        const maxValue = values.length ? Math.max.apply(this, values) : 0;

        // Toggle download button
        this.downloadButton.toggleAttribute('disabled', !values.length);

        // Get bin width and count
        const binWidth = parseInt(this.binInput.value);
        const binCount = Math.ceil(maxValue / binWidth) + 1;

        // Get chart container width
        const width = this.chartContainer.clientWidth - this.margin.left - this.margin.right;

        // Update x
        const xScale = d3.scaleLinear()
            .domain([0, binWidth * binCount])
            .range([0, width]);

        const ticksX = new Array(binCount + binWidth)
            .fill(0)
            .map((t, index) => binWidth * index);

        // Generate histogram
        const histogram = d3.bin()
            .domain(xScale.domain())
            .thresholds(ticksX);

        // Get bins, max y and chart height
        const bins = histogram(values);
        const maxY = d3.max(bins, d => d.length) + 1;
        const height = values.length ? Math.ceil((width / binCount) * maxY) : 300;

        // Update y
        const yScale = d3.scaleLinear()
            .range([height, 0])
            .domain([0, maxY]);

        const ticksY = new Array(maxY + 1)
            .fill(0)
            .map((t, index) => index);

        // Update labels
        const labelsX = d3.axisBottom()
            .scale(xScale)
            .tickSize(-height)
            .tickValues(ticksX)
            .tickFormat(d => Math.round(d));

        this.chartXTicks.attr('transform', `translate(${this.margin.left}, ${height + this.margin.top})`)
            .call(labelsX)
            .call(this.tickStyle);

        const labelsY = d3.axisLeft()
            .scale(yScale)
            .tickSize(-width)
            .tickValues(ticksY)
            .tickFormat(d => Math.round(d));

        this.chartYTicks.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
            .call(labelsY)
            .call(this.tickStyle);

        // Update bars
        this.chartBars.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
        const bars = this.chartBars.selectAll('rect')
            .data(bins);

        bars.enter()
            .append('rect')
            .merge(bars)
            .attr('transform', d => `translate(${xScale(d.x0)},${yScale(d.length)})`)
            .attr('width', d => xScale(d.x1) - xScale(d.x0))
            .attr('height', d => height - yScale(d.length))
            .style('fill', (d, index) => d3.schemeCategory20[index % d3.schemeCategory20.length]);

        bars.exit()
            .remove();

        // Update container
        const containerHeight = height + this.margin.top + this.margin.bottom;
        this.chart.attr('height', containerHeight);

        // Update labels
        this.chartTitle.text(this.titleInput.value);
        this.chartXAxis.text(this.xAxisInput.value);
        this.chartYAxis.text(this.yAxisInput.value);
        this.chartYAxis.attr('x', -Math.ceil(containerHeight / 2));
    }

    tickStyle(g) {
        return g.selectAll('.tick line')
            .attr('stroke-opacity', 0.2);
    }

    download() {
        // Set canvas size
        this.canvas.width = this.chartContainer.clientWidth;
        this.canvas.height = this.chartContainer.clientHeight;

        // Render chart into canvas
        const v = canvg.Canvg.fromString(this.ctx, this.chartContainer.innerHTML);
        v.start();

        // Create blob
        this.canvas.toBlob(blob => {
            // Create link
            const link = document.createElement('a');
            link.download = `${this.titleInput.value }.png`;
            link.href = URL.createObjectURL(blob);
            link.click();

            // Stop rendering
            v.stop();
        });
    }

}