'use strict';
var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var contextDirectory = path.resolve(__dirname, 'app');
var https = require('https');

var APP = __dirname + '/app';
var target = __dirname + '/target/classes/META-INF/resources/';

module.exports = {
    context: APP,
    entry: {
        app: './bootstrap.ts'
    },
    output: {
        path: target,
        filename: 'bundle_[hash].js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || 'development')
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jquery: "jquery",
            "window.jQuery": "jquery",
            jQuery: "jquery"
        }),
        new HtmlWebpackPlugin({
            title: "zickner.pizza",
            template: path.resolve(contextDirectory, "index.html")
        })
    ],
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: "eslint-loader",
                exclude: /node_modules/
            },
            {
                test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url-loader?limit=10000&mimetype=application/font-woff"
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url-loader?limit=10000&mimetype=application/octet-stream"
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file-loader"
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url-loader?limit=10000&mimetype=image/svg+xml"
            },
            {
                test: /\.tsx?$/,
                loader: 'babel-loader!ts-loader'
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: contextDirectory,
                query: {
                    presets: ['es2015']
                }
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.scss$/,
                loader: 'style-loader!css-loader!sass-loader'
            },
            {
                test: /\.html$/,
                include: contextDirectory,
                loader: "html-loader",
                options: {
                    minimize: true,
                    removeAttributeQuotes: false,
                    caseSensitive: true,
                    customAttrSurround: [[/#/, /(?:)/], [/\*/, /(?:)/], [/\[?\(?/, /(?:)/]],
                    customAttrAssign: [/\)?\]?=/]
                }
            }
        ]
    },
    devServer: {
        proxy: {
            '/api/*': {
                target: 'http://localhost:8080/'
            }
        },
        historyApiFallback: true
    }
};