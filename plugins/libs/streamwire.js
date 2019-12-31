var Xray = require('x-ray')
var x = Xray()
var helper = require('../helpers');
const got = require('got');
const { CookieJar } = require('tough-cookie');

var BaseUrlResolver = require('../BaseResolver');

class StreamwireResolver extends BaseUrlResolver {
    constructor() {
        super();
        this.domains = ['https://streamwire'];
    }

    async resolveInner(_urlToResolve) {
        var links = [];
        var unpackstr = '';
        return new Promise(function (resolve, reject) {
            x(_urlToResolve, {
                title: 'title',
                script: ['script']
            })((err, obj) => {

                const script = obj.script.filter(x => x.startsWith('eval(function(p,a,c,k,e,d)'))[0];
                const unpack = helper.unPack(script);
                var regex = /src:"(https[^"]*)/g
                var el = unpack && Array.from(unpack.matchAll(regex), m => m[1])[0];
                if (el) {
                    var title = obj.title;
                    links.push(BaseUrlResolver.prototype.createResult(title, el, '', true));
                }
                resolve(links);
            })
        });
    }
}

module.exports = StreamwireResolver;