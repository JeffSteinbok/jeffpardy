let CopyWebpackPlugin = require('copy-webpack-plugin');

const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/web/Index.tsx',
        buzzer: './src/web/Buzzer.tsx'
    },
    output: {
        path: path.resolve(__dirname, './wwwroot/js/dist'),
        filename: '[name].js',
        publicPath: 'dist/',
        sourceMapFilename: "[name].js.map"
    },
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.(js|jsx)/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": ["@babel/preset-env", "@babel/preset-react"]
                    }
                }
            },
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['*', '.js', '.jsx', '.tsx']
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: './src/web/Jeopardy.scss',
                to: '../../css/dist/Jeopardy.css',
            }
        ])
    ]
};
