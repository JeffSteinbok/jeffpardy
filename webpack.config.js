let CopyWebpackPlugin = require('copy-webpack-plugin');

const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/web/pages/startPage/StartPage.tsx',
        host: './src/web/pages/hostPage/HostPage.tsx',
        player: './src/web/pages/playerPage/PlayerPage.tsx'
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
                },
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
    }
};
