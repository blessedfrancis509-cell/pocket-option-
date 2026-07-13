'use strict';
var aa = {},
    ba = function(a) {
        function b(d) {
            return a.next(d)
        }

        function c(d) {
            return a.throw(d)
        }
        return new Promise(function(d, e) {
            function f(g) {
                g.done ? d(g.value) : Promise.resolve(g.value).then(b, c).then(f, e)
            }
            f(a.next())
        })
    },
    h = function(a) {
        return ba(a())
    };
/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
let m = null;

function p(a) {
    var b = a.length,
        c = b * 3 / 4;
    c % 3 ? c = Math.floor(c) : "=.".indexOf(a[b - 1]) != -1 && (c = "=.".indexOf(a[b - 2]) != -1 ? c - 2 : c - 1);
    var d = new Uint8Array(c),
        e = 0;
    ca(a, function(f) {
        d[e++] = f
    });
    return e !== c ? d.subarray(0, e) : d
}

function ca(a, b) {
    function c(e) {
        for (; d < a.length;) {
            let f = a.charAt(d++),
                g = m[f];
            if (g != null) return g;
            if (!/^[\s\xa0]*$/.test(f)) throw Error("Unknown base64 encoding at char: " + f);
        }
        return e
    }
    da();
    for (var d = 0;;) {
        let e = c(-1),
            f = c(0),
            g = c(64),
            k = c(64);
        if (k === 64 && e === -1) break;
        b(e << 2 | f >> 4);
        g != 64 && (b(f << 4 & 240 | g >> 2), k != 64 && b(g << 6 & 192 | k))
    }
}

function da() {
    if (!m) {
        m = {};
        var a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""),
            b = ["+/=", "+/", "-_=", "-_.", "-_"];
        for (let c = 0; c < 5; c++) {
            let d = a.concat(b[c].split(""));
            for (let e = 0; e < d.length; e++) {
                let f = d[e];
                m[f] === void 0 && (m[f] = e)
            }
        }
    }
};
/*

 Copyright 2020 Google LLC
 SPDX-License-Identifier: Apache-2.0
*/
var t = class extends Error {
    constructor(a) {
        super(a);
        Object.setPrototypeOf(this, t.prototype)
    }
};
t.prototype.name = "SecurityException";
var u = class extends Error {
    constructor(a) {
        super(a);
        Object.setPrototypeOf(this, u.prototype)
    }
};
u.prototype.name = "InvalidArgumentsException";

function A(...a) {
    var b = 0;
    for (let e = 0; e < arguments.length; e++) b += arguments[e].length;
    var c = new Uint8Array(b),
        d = 0;
    for (let e = 0; e < arguments.length; e++) c.set(arguments[e], d), d += arguments[e].length;
    return c
}

function C(a) {
    var b = a.replace(/-/g, "+").replace(/_/g, "/");
    return D(globalThis.atob(b))
}

function G(a) {
    var b = "";
    for (let c = 0; c < a.length; c += 1) b += String.fromCharCode(a[c]);
    return globalThis.btoa(b).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function D(a) {
    var b = [],
        c = 0;
    for (let d = 0; d < a.length; d++) {
        let e = a.charCodeAt(d);
        b[c++] = e
    }
    return new Uint8Array(b)
};
/*

 Copyright 2022 Google LLC
 SPDX-License-Identifier: Apache-2.0
*/
var ea = function(a, b, c, d) {
        return h(function*() {
            if (c.length < (a.o ? 28 : 16)) throw new t("ciphertext too short");
            if (b.length !== 12) throw new t("IV must be 12 bytes");
            var e = {
                name: "AES-GCM",
                iv: b,
                tagLength: 128
            };
            d && (e.additionalData = d);
            var f = a.o ? new Uint8Array(c.subarray(12)) : c;
            try {
                return new Uint8Array(yield globalThis.crypto.subtle.decrypt(e, a.key, f))
            } catch (g) {
                throw new t(String(g));
            }
        })
    },
    fa = class {
        constructor({
            key: a,
            o: b
        }) {
            this.key = a;
            this.o = b
        }
        encrypt(a, b, c) {
            var d = this;
            return h(function*() {
                if (a.length !== 12) throw new t("IV must be 12 bytes");
                var e = {
                    name: "AES-GCM",
                    iv: a,
                    tagLength: 128
                };
                c && (e.additionalData = c);
                var f = yield globalThis.crypto.subtle.encrypt(e, d.key, b);
                return d.o ? A(a, new Uint8Array(f)) : new Uint8Array(f)
            })
        }
    };

function H({
    key: a,
    o: b
}) {
    return h(function*() {
        if (![16, 32].includes(a.length)) throw new u("unsupported AES key size: ${n}");
        var c = yield globalThis.crypto.subtle.importKey("raw", a, {
            name: "AES-GCM",
            length: a.length
        }, !1, ["encrypt", "decrypt"]);
        return new fa({
            key: c,
            o: b
        })
    })
};

function I(a) {
    switch (a) {
        case 1:
            return "P-256";
        case 2:
            return "P-384";
        case 3:
            return "P-521"
    }
}

function J(a) {
    switch (a) {
        case "P-256":
            return 1;
        case "P-384":
            return 2;
        case "P-521":
            return 3
    }
    throw new u("unknown curve: " + a);
}

function K(a) {
    switch (a) {
        case 1:
            return 32;
        case 2:
            return 48;
        case 3:
            return 66
    }
}

function ha(a, b) {
    return h(function*() {
        var c = a.algorithm.namedCurve;
        if (!c) throw new u("namedCurve must be provided");
        var d = Object.assign({}, {
                "public": b
            }, a.algorithm),
            e = 8 * K(J(c)),
            f = yield globalThis.crypto.subtle.deriveBits(d, a, e);
        return new Uint8Array(f)
    })
}

function ia(a) {
    return h(function*() {
        return yield globalThis.crypto.subtle.generateKey({
            name: "ECDH",
            namedCurve: a
        }, !0, ["deriveKey", "deriveBits"])
    })
}

function ja(a) {
    return h(function*() {
        var b = yield globalThis.crypto.subtle.exportKey("jwk", a);
        if (b.crv === void 0) throw new u("crv must be provided");
        var c = K(J(b.crv));
        if (b.x === void 0) throw new u("x must be provided");
        if (b.y === void 0) throw new u("y must be provided");
        var d = C(b.x);
        if (d.length !== c) throw new u(`x-coordinate byte-length is invalid (got: ${d.length}, want: ${c}).`);
        var e = C(b.y);
        if (e.length !== c) throw new u(`y-coordinate byte-length is invalid (got: ${e.length}, want: ${c}).`);
        return b
    })
}

function ka(a) {
    return h(function*() {
        var b = a.crv;
        if (!b) throw new u("crv must be provided");
        var c;
        try {
            c = yield globalThis.crypto.subtle.importKey("jwk", a, {
                name: "ECDH",
                namedCurve: b
            }, !0, [])
        } catch (d) {
            throw new t("failed to import key");
        }
        return c
    })
};
var la = N(1, 0),
    ma = N(2, 16),
    na = N(2, 18);
N(2, 25722);
var oa = N(2, 1),
    pa = N(2, 3),
    qa = N(2, 1),
    ra = N(2, 2),
    sa = D("KEM"),
    ta = D("HPKE"),
    O = D("HPKE-v1");

function N(a, b) {
    var c = new Uint8Array(a);
    for (let d = 0; d < a; d++) c[d] = b >> 8 * (a - d - 1) & 255;
    return c
}

function va({
    M: a,
    L: b,
    I: c
}) {
    return A(ta, a, b, c)
}

function T({
    m: a,
    l: b,
    j: c
}) {
    return A(O, c, D(a), b)
}

function U({
    u: a,
    info: b,
    j: c,
    length: d
}) {
    return A(N(2, d), O, c, D(a), b)
}

function wa(a, b) {
    return h(function*() {
        var c; {
            let d = K(J(a));
            if (b.length !== 1 + 2 * d || b[0] !== 4) throw new t("invalid point");
            c = {
                kty: "EC",
                crv: a,
                x: G(new Uint8Array(b.subarray(1, 1 + d))),
                y: G(new Uint8Array(b.subarray(1 + d, b.length))),
                ext: !0
            }
        }
        return yield ka(c)
    })
}

function xa(a) {
    return h(function*() {
        var b = a.algorithm,
            c = yield ja(a);
        if (!c.crv) throw new t("Curve has to be defined.");
        var d; {
            let e = K(J(b.namedCurve)),
                f = c.x,
                g = c.y;
            if (f === void 0) throw new u("x must be provided");
            if (g === void 0) throw new u("y must be provided");
            let k = new Uint8Array(1 + 2 * e),
                l = C(g),
                q = C(f);
            k.set(l, 1 + 2 * e - l.length);
            k.set(q, 1 + e - q.length);
            k[0] = 4;
            d = k
        }
        return d
    })
};
var ya = class {
    constructor(a) {
        this.A = a
    }
    seal({
        key: a,
        nonce: b,
        O: c,
        C: d
    }) {
        var e = this;
        return h(function*() {
            if (a.length !== e.A) throw new t("Unexpected key length: " + a.length.toString());
            return yield(yield H({
                key: a,
                o: !1
            })).encrypt(b, c, d)
        })
    }
    open({
        key: a,
        nonce: b,
        J: c,
        C: d
    }) {
        var e = this;
        return h(function*() {
            if (a.length !== e.A) throw new t("Unexpected key length: " + a.length.toString());
            return ea(yield H({
                key: a,
                o: !1
            }), b, c, d)
        })
    }
};
var za = class {};

function V(a) {
    if (a == null || !(a instanceof Uint8Array)) throw new u("input must be a non null Uint8Array");
};
var Aa = function(a, b) {
        return h(function*() {
            V(b);
            var c = yield globalThis.crypto.subtle.sign({
                name: "HMAC",
                hash: {
                    name: a.hash
                }
            }, a.key, b);
            return new Uint8Array(c.slice(0, a.g))
        })
    },
    Ba = class extends za {
        constructor(a, b, c) {
            super();
            this.hash = a;
            this.key = b;
            this.g = c
        }
    };

function Ca(a, b, c) {
    return h(function*() {
        V(b);
        if (!Number.isInteger(c)) throw new u("invalid tag size, must be an integer");
        if (c < 10) throw new u("tag too short, must be at least " + (10).toString() + " bytes");
        switch (a) {
            case "SHA-1":
                if (c > 20) throw new u("tag too long, must not be larger than 20 bytes");
                break;
            case "SHA-256":
                if (c > 32) throw new u("tag too long, must not be larger than 32 bytes");
                break;
            case "SHA-384":
                if (c > 48) throw new u("tag too long, must not be larger than 48 bytes");
                break;
            case "SHA-512":
                if (c >
                    64) throw new u("tag too long, must not be larger than 64 bytes");
                break;
            default:
                throw new u(a + " is not supported");
        }
        var d = yield globalThis.crypto.subtle.importKey("raw", b, {
            name: "HMAC",
            hash: {
                name: a
            },
            length: b.length * 8
        }, !1, ["sign", "verify"]);
        return new Ba(a, d, c)
    })
};
var Da = function(a, b, c) {
        return h(function*() {
            V(b);
            var d = W(a),
                e;
            ((e = c) == null ? 0 : e.length) || (c = new Uint8Array(d));
            V(c);
            return yield Aa(yield Ca(a.v, c, d), b)
        })
    },
    X = function(a, {
        l: b,
        m: c,
        j: d,
        salt: e
    }) {
        return h(function*() {
            return yield Da(a, T({
                m: c,
                l: b,
                j: d
            }), e)
        })
    },
    Ea = function(a, b, c, d) {
        return h(function*() {
            if (!Number.isInteger(d)) throw new t("length must be an integer");
            if (d <= 0) throw new t("length must be positive");
            var e = W(a);
            if (d > 255 * e) throw new t("length too large");
            V(c);
            for (var f = yield Ca(a.v, b, e), g = 1, k = 0,
                    l = new Uint8Array(0), q = new Uint8Array(d);;) {
                let r = new Uint8Array(l.length + c.length + 1);
                r.set(l, 0);
                r.set(c, l.length);
                r[r.length - 1] = g;
                l = yield Aa(f, r);
                if (k + l.length < d) q.set(l, k), k += l.length, g++;
                else {
                    q.set(l.subarray(0, d - k), k);
                    break
                }
            }
            return q
        })
    },
    Fa = function(a, {
        H: b,
        info: c,
        u: d,
        j: e,
        length: f
    }) {
        return h(function*() {
            return yield Ea(a, b, U({
                u: d,
                info: c,
                j: e,
                length: f
            }), f)
        })
    },
    Ga = function(a, {
        l: b,
        m: c,
        info: d,
        u: e,
        j: f,
        length: g,
        salt: k
    }) {
        return h(function*() {
            var l = yield Da(a, T({
                m: c,
                l: b,
                j: f
            }), k);
            return yield Ea(a, l, U({
                u: e,
                info: d,
                j: f,
                length: g
            }), g)
        })
    },
    W = function(a) {
        switch (a.v) {
            case "SHA-256":
                return 32;
            case "SHA-512":
                return 64
        }
    },
    Y = class {
        constructor(a) {
            this.v = a
        }
    };
var Ha = function(a) {
        var b = a.g,
            c = new Uint8Array(12);
        for (let f = 0; f < 12; f++) c[f] = Number(b >> BigInt(8 * (12 - f - 1))) & 255;
        var d = a.h;
        if (d.length !== c.length) throw new u("Both byte arrays should be of the same length");
        var e = new Uint8Array(d.length);
        for (let f = 0; f < e.length; f++) e[f] = d[f] ^ c[f];
        if (a.g >= a.i) throw new t("message limit reached");
        a.g += BigInt(1);
        return e
    },
    Ia = class {
        constructor(a, b, c, d) {
            this.D = a;
            this.key = b;
            this.h = c;
            this.aead = d;
            this.g = BigInt(0);
            this.i = (BigInt(1) << BigInt(96)) - BigInt(1)
        }
        seal(a, b) {
            var c = this;
            return h(function*() {
                var d = Ha(c);
                return yield c.aead.seal({
                    key: c.key,
                    nonce: d,
                    O: a,
                    C: b
                })
            })
        }
        open(a, b) {
            var c = this;
            return h(function*() {
                var d = Ha(c);
                return c.aead.open({
                    key: c.key,
                    nonce: d,
                    J: a,
                    C: b
                })
            })
        }
    };

function Ja(a, b, c, d, e, f) {
    return h(function*() {
        var g;
        a: {
            switch (e.A) {
                case 16:
                    g = qa;
                    break a;
                case 32:
                    g = ra;
                    break a
            }
            g = void 0
        }
        var k;
        a: {
            switch (d.v) {
                case "SHA-256":
                    k = oa;
                    break a;
                case "SHA-512":
                    k = pa;
                    break a
            }
            k = void 0
        }
        var l = va({
                M: Ka(c),
                L: k,
                I: g
            }),
            q = X(d, {
                l: new Uint8Array(0),
                m: "psk_id_hash",
                j: l
            }),
            r = yield X(d, {
                l: f,
                m: "info_hash",
                j: l
            }), E = yield q, F = A(la, E, r), B = yield X(d, {
                l: new Uint8Array(0),
                m: "secret",
                j: l,
                salt: b
            }), P = Fa(d, {
                H: B,
                info: F,
                u: "key",
                j: l,
                length: e.A
            }), v = yield Fa(d, {
                H: B,
                info: F,
                u: "base_nonce",
                j: l,
                length: 12
            }), n = yield P;
        return new Ia(a, n, v, e)
    })
}

function La(a, b, c, d, e) {
    return h(function*() {
        var f = yield Ma(b, a);
        return yield Ja(f.D, f.P, b, c, d, e)
    })
};
var Na = function(a) {
        return h(function*() {
            return yield xa(a.publicKey)
        })
    },
    Oa = class {
        constructor(a, b) {
            this.privateKey = a;
            this.publicKey = b
        }
    };

function Pa(a) {
    return h(function*() {
        Qa(a.privateKey, "private");
        Qa(a.publicKey, "public");
        return new Oa(a.privateKey, a.publicKey)
    })
}

function Qa(a, b) {
    if (b !== a.type) throw new u(`keyPair ${b} key was of type ${a.type}`);
    var c = a.algorithm;
    if ("ECDH" !== c.name) throw new u(`keyPair ${b} key should be ECDH but found ${c.name}`);
};
var Sa = function(a) {
        switch (a) {
            case 1:
                return new Ra(new Y("SHA-256"), 1);
            case 3:
                return new Ra(new Y("SHA-512"), 3)
        }
    },
    Ka = function(a) {
        switch (a.g) {
            case 1:
                return ma;
            case 3:
                return na
        }
    },
    Ma = function(a, b) {
        return h(function*() {
            var c = yield ia(I(a.g));
            return yield a.h(b, yield Pa(c))
        })
    },
    Ta = function(a, b, c, d) {
        return h(function*() {
            var e = A(c, d),
                f = A(sa, Ka(a));
            return yield Ga(a.i, {
                l: b,
                m: "eae_prk",
                info: e,
                u: "shared_secret",
                j: f,
                length: W(a.i)
            })
        })
    },
    Ra = class {
        constructor(a, b) {
            this.i = a;
            this.g = b;
            this.TEST_ONLY = this.h
        }
        h(a, b) {
            var c =
                this;
            return h(function*() {
                var d = yield wa(I(c.g), a), e = ha(b.privateKey, d), f = yield Na(b), g = yield e;
                return {
                    P: yield Ta(c, g, f, a), D: f
                }
            })
        }
    };
/*

 Copyright 2024 Google LLC
 SPDX-License-Identifier: Apache-2.0
*/
function Ua(a, b) {
    var c;
    c || (c = new Uint8Array(0));
    var d, e, f;
    switch (a) {
        case 1:
            d = Sa(1);
            e = new Y("SHA-256");
            f = new ya(16);
            break;
        case 2:
            d = Sa(3);
            e = new Y("SHA-512");
            f = new ya(32);
            break;
        default:
            throw new t(`Unknown HPKE parameters: ${a}`);
    }
    var g = La(b, d, e, f, c);
    return k => h(function*() {
        if (!g) throw new t("Context has already been used");
        var l = g;
        g = null;
        var q = yield l, r = yield q.seal(k, new Uint8Array(0));
        return A(q.D, r)
    })
};

function Va(a) {
    try {
        let b = JSON.parse(a).keys,
            c = b[Math.floor(Math.random() * b.length)];
        return c && c.hpkePublicKey && c.hpkePublicKey.params && c.hpkePublicKey.params.kem && c.hpkePublicKey.params.kdf && c.hpkePublicKey.params.aead && c.hpkePublicKey.version !== void 0 && c.id && c.hpkePublicKey.publicKey ? c : void 0
    } catch (b) {}
}
var Wa = function(a, b) {
        return h(function*() {
            if (a.status) return Z(a.status);
            try {
                let e = p(a.h(b)),
                    f = yield a.context(e);
                var c;
                if (f.length <= 8192) c = String.fromCharCode.apply(null, f);
                else {
                    var d = "";
                    for (let k = 0; k < f.length; k += 8192) d += String.fromCharCode.apply(null, Array.prototype.slice.call(f, k, k + 8192));
                    c = d
                }
                let g = a.h(c);
                g = g.replace(/\//g, "_");
                g = g.replace(/\+/g, "-");
                return Z(0, g)
            } catch (e) {
                return Z(6)
            }
        })
    },
    Ya = class {
        constructor(a, b) {
            this.g = 0;
            this.context = () => h(function*() {
                return new Uint8Array(0)
            });
            this.h = e => b(e);
            if (a) {
                this.N = a.id;
                var c = a.hpkePublicKey.params.kdf,
                    d = a.hpkePublicKey.params.aead;
                if (a.hpkePublicKey.params.kem === "DHKEM_P256_HKDF_SHA256" && c === "HKDF_SHA256" && d === "AES_128_GCM") {
                    this.i = 1;
                    this.G = a;
                    try {
                        let e, f = p((e = this.G) == null ? void 0 : e.hpkePublicKey.publicKey);
                        f && this.i ? this.context = Ua(this.i, f) : this.status = 11
                    } catch (e) {
                        this.status = 6
                    }
                } else this.status = 7
            } else this.status = 8
        }
        setTimeout(a) {
            this.g = a
        }
        encrypt(a) {
            var b = Wa(this, a);
            return this.g ? Promise.race([b, Xa(this.g).then(() => Z(14))]) : b
        }
        getEncryptionKeyId() {
            return this.N
        }
    };

function Z(a, b) {
    return a === 0 ? {
        cipherText: b,
        status: a
    } : {
        status: a
    }
}

function Xa(a) {
    return new Promise(b => void setTimeout(b, a))
};

function Za(a) {
    var b = 1,
        c, d, e;
    if (a)
        for (b = 0, d = a.length - 1; d >= 0; d--) e = a.charCodeAt(d), b = (b << 6 & 268435455) + e + (e << 14), c = b & 266338304, b = c !== 0 ? b ^ c >> 21 : b;
    return b
};
var $a = class {
    constructor() {
        this.cache = new Map
    }
    get(a) {
        var b = Za(a),
            c = this.cache.get(b);
        if (!c) return {
            promise: void 0,
            F: 0
        };
        if (Date.now() >= c.timestamp + 9E5) return this.cache.delete(b), {
            promise: void 0,
            F: 3
        };
        var d = c.B ? 2 : 1;
        return {
            promise: c.B ? Promise.resolve(c.B) : c.promise,
            F: d
        }
    }
    set(a, b) {
        var c = {
            promise: b,
            B: void 0,
            timestamp: Date.now()
        };
        this.cache.set(Za(a), c);
        b.then(d => {
            c.B = d
        })
    }
};

function ab(a) {
    switch (a) {
        case 0:
            break;
        case 9:
            return "e4";
        case 6:
            return "e5";
        case 14:
            return "e6";
        default:
            return "e7"
    }
};

function bb(a, b) {
    return a.length >= b.length && a.substring(0, b.length) === b
};
/*
 jQuery (c) 2005, 2012 jQuery Foundation, Inc. jquery.org/license.
*/
var cb = /\[object (Boolean|Number|String|Function|Array|Date|RegExp)\]/,
    db = function(a) {
        var b;
        if (!(b = !a)) {
            var c;
            if (a == null) c = String(a);
            else {
                var d = cb.exec(Object.prototype.toString.call(Object(a)));
                c = d ? d[1].toLowerCase() : "object"
            }
            b = c != "object"
        }
        if (b || a.nodeType || a == a.window) return !1;
        try {
            if (a.constructor && !Object.prototype.hasOwnProperty.call(Object(a), "constructor") && !Object.prototype.hasOwnProperty.call(Object(a.constructor.prototype), "isPrototypeOf")) return !1
        } catch (f) {
            return !1
        }
        for (var e in a);
        return e ===
            void 0 || Object.prototype.hasOwnProperty.call(Object(a), e)
    };
var gb = function(a, b) {
        if (b) {
            var c = db(b.options) ? b.options : {};
            for (let d of Object.keys(b)) {
                let e = b[d];
                switch (d) {
                    case "send_pixel":
                        eb(e, c, (f, g) => {
                            a.h({
                                url: f,
                                method: 0,
                                templates: a.templates,
                                processResponse: !1,
                                attributionReporting: g.attribution_reporting
                            }, fb(a, g))
                        });
                        break;
                    case "fetch":
                        eb(e, c, (f, g) => {
                            a.h({
                                url: f,
                                method: 0,
                                templates: a.templates,
                                processResponse: g.process_response || !1,
                                attributionReporting: g.attribution_reporting
                            }, fb(a, g))
                        })
                }
            }
        }
    },
    hb = function(a, b) {
        b = a.g + b;
        for (var c = b.indexOf("\n\n"); c !== -1;) {
            var d =
                gb,
                e = a,
                f;
            a: {
                let [k, l] = b.substring(0, c).split("\n");
                if (bb(k, "event: message") && bb(l, "data: ")) {
                    var g = l.substring(6);
                    try {
                        f = JSON.parse(g);
                        break a
                    } catch (q) {}
                }
                f = void 0
            }
            d(e, f);
            b = b.substring(c + 2);
            c = b.indexOf("\n\n")
        }
        a.g = b
    },
    fb = function(a, b) {
        return () => {
            var c = b.fallback_url,
                d = b.fallback_url_method;
            c && d && gb(a, {
                [d]: [c],
                options: {}
            })
        }
    },
    eb = function(a, b, c) {
        if (Array.isArray(a))
            for (let d of a) typeof d === "string" && c(d, b)
    },
    ib = class {
        constructor() {
            this.g = ""
        }
    };
Object.freeze({
    attributionsrc: ""
});
var jb = Object.freeze({
    eventSourceEligible: !1,
    triggerEligible: !0
});
const kb = /^[0-9A-Fa-f]{64}$/;

function lb(a) {
    try {
        return (new TextEncoder).encode(a)
    } catch (b) {
        let c = [];
        for (let d = 0; d < a.length; d++) {
            let e = a.charCodeAt(d);
            e < 128 ? c.push(e) : e < 2048 ? c.push(192 | e >> 6, 128 | e & 63) : e < 55296 || e >= 57344 ? c.push(224 | e >> 12, 128 | e >> 6 & 63, 128 | e & 63) : (e = 65536 + ((e & 1023) << 10 | a.charCodeAt(++d) & 1023), c.push(240 | e >> 18, 128 | e >> 12 & 63, 128 | e >> 6 & 63, 128 | e & 63))
        }
        return new Uint8Array(c)
    }
}

function mb(a, b) {
    if (a === "" || a === "e0") return Promise.resolve(a);
    var c;
    if ((c = b.crypto) == null ? 0 : c.subtle) {
        if (kb.test(a)) return Promise.resolve(a);
        try {
            let d = lb(a);
            return b.crypto.subtle.digest("SHA-256", d).then(e => nb(e, b)).catch(() => "e2")
        } catch (d) {
            return Promise.resolve("e2")
        }
    } else return Promise.resolve("e1")
}

function nb(a, b) {
    var c = Array.from(new Uint8Array(a)).map(d => String.fromCharCode(d)).join("");
    return b.btoa(c).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
};
var ob = {
    R: 0,
    S: 1,
    0: "GET",
    1: "POST"
};
var qb = function(a, b, c, d) {
        return h(function*() {
            if (d) {
                let k = a.h.get(b);
                if (k.promise) return k.promise.then(l => l + `&gap.ch=${k.F}`)
            }
            var e = Va(c.encryptionKeyString || ""),
                f = new Ya(e, a.g.btoa),
                g = pb(a, a.g.performance.now(), (e == null ? void 0 : e.id) || "undefined", f.encrypt(b));
            return d ? (a.h.set(b, g), g.then(k => k + "&gap.ch=4")) : g
        })
    },
    rb = function(a, b) {
        var c = b.url;
        if (!c) return {
            failureType: 9,
            command: 0,
            data: "url required."
        };
        if (b.strict) try {
            let d = new URL(a.g.location.href),
                e = new URL(c, d.origin);
            if (e.origin !== d.origin) return {
                failureType: 18,
                command: 0,
                data: "Cross-origin command blocked"
            };
            let f = d.pathname,
                g = f.indexOf("/_/service_worker"),
                k = g !== -1 ? f.substring(0, g) : "";
            k.endsWith("/") && (k = k.slice(0, -1));
            if (!(e.pathname.startsWith("/g/collect") || k && e.pathname.startsWith(k))) return {
                failureType: 18,
                command: 0,
                data: "Invalid command path blocked"
            }
        } catch (d) {
            return {
                failureType: 12,
                command: 0,
                data: "Invalid command URL: " + d.message
            }
        }
    },
    ub = function(a, b, c) {
        return h(function*() {
            var d = yield sb(a, b, c);
            if ("failureType" in d) return d;
            yield tb(a, d, b);
            return d
        })
    },
    vb = function(a, b, c, d) {
        h(function*() {
            var e = b.commandType,
                f = b.params;
            if (e === 0) {
                let g = rb(a, f);
                g ? d(g) : (ub(a, f).catch(() => {}), c({
                    data: f.url
                }))
            } else d({
                failureType: 8,
                command: e,
                data: `Command with type ${e} unknown.`
            })
        })
    },
    wb = function(a, b, c) {
        return h(function*() {
            return b.url ? yield ub(a, b, c): {
                failureType: 9,
                command: 0,
                data: "url required."
            }
        })
    },
    sb = function(a, b, c) {
        return h(function*() {
            function d(n) {
                return h(function*() {
                    var [w, x] = n.split("|"), [Q, L] = w.split("."), y = L, z = l[Q];
                    z || (z = w, y = "");
                    var S = M => h(function*() {
                        try {
                            return yield P(x)(M)
                        } catch (R) {
                            throw new xb(R.message);
                        }
                    });
                    if (!y) {
                        if (typeof z === "string") return yield S(z);
                        let M = z,
                            R = Object.keys(M).map(ua => h(function*() {
                                var yb = yield S(M[ua]);
                                return `${ua}=${yb}`
                            }));
                        return (yield Promise.all(R)).join("&")
                    }
                    return typeof z === "object" && z[y] ? yield S(z[y]): n
                })
            }

            function e(n) {
                return h(function*() {
                    for (var w, x = ""; n.match(B) && x !== n;) {
                        x = n;
                        w = n.matchAll(B);
                        let Q = [...w].map(y => d(y[1])),
                            L = yield Promise.all(Q);
                        L.length !== 0 && (n = n.replace(B, y => L.shift() || y))
                    }
                    return n
                })
            }
            var {
                url: f,
                body: g
            } = b, {
                attributionReporting: k,
                templates: l,
                processResponse: q,
                method: r = 0,
                referer: E,
                soReferrer: F
            } = b, B = RegExp("\\${([^${}]*?)}", "g"), P = n => {
                if (n == null) return x => h(function*() {
                    return x
                });
                var w = a.i[n];
                if (w == null) throw Error(`Unknown filter: ${n}`);
                return x => h(function*() {
                    return yield w(x, b)
                })
            };
            try {
                f = yield e(f), g = g ? yield e(g): void 0
            } catch (n) {
                return c == null || c(), {
                    failureType: 9,
                    command: 0,
                    data: `Failed to inject template values: ${n}`
                }
            }
            var v = {
                method: ob[r],
                credentials: "include",
                body: r === 1 ? g : void 0,
                keepalive: !0,
                redirect: "follow"
            };
            if (E) try {
                v.headers = {
                    ["X-Effective-Origin"]: (new URL(E)).origin,
                    ["X-Effective-Referer"]: E
                }
            } catch (n) {} else F && (v.referrer = F);
            q || (v.mode = "no-cors");
            k && (v.attributionReporting = jb);
            try {
                let n = yield a.g.fetch(f, v);
                return v.mode === "no-cors" || n.ok ? {
                    data: q ? yield n.text(): f
                } : (c == null || c(), {
                    failureType: 9,
                    command: 0,
                    data: "Fetch failed"
                })
            } catch (n) {
                return c == null || c(), {
                    failureType: 9,
                    command: 0,
                    data: `Fetch failed: ${n}`
                }
            }
        })
    },
    tb = function(a, b, c) {
        return h(function*() {
            if (c.processResponse) {
                var d = [];
                hb(new zb(c.templates, (e, f) => {
                    d.push(wb(a, e, f))
                }), b.data);
                return Promise.all(d)
            }
        })
    },
    pb = function(a, b, c, d) {
        return d.then(e => {
            var f = a.g.performance.now(),
                g = [`emkid.${c}~`, `ev.${encodeURIComponent(e.cipherText||"")}`, `&_es=${e.status}`];
            b && f && g.push(`&_est=${Math.round(f)-Math.round(b)}`);
            return g.join("")
        }, () => [`ec.${ab(15)}`, "&_es=15"].join("")).catch(() => [`ec.${ab(16)}`, "&_es=16"].join(""))
    },
    Ab = class {
        constructor(a) {
            this.g = a;
            this.h = new $a;
            this.i = {
                sha256: b => {
                    var c = this;
                    return h(function*() {
                        return yield mb(b, c.g)
                    })
                },
                encode: b => h(function*() {
                    return encodeURIComponent(b)
                }),
                encrypt: (b, c) => {
                    var d = this;
                    return h(function*() {
                        return yield qb(d, b, c, !1)
                    })
                },
                encrypt_with_memo: (b, c) => {
                    var d = this;
                    return h(function*() {
                        return yield qb(d, b, c, !0)
                    })
                }
            }
        }
    };
class zb extends ib {
    constructor(a, b) {
        super();
        this.templates = a;
        this.h = b
    }
}
class xb extends Error {
    constructor(a) {
        super(a)
    }
};
var Bb = function(a, b, c) {
    a.g[b] == null && (a.g[b] = 0, a.h[b] = c, a.i++);
    a.g[b]++;
    return {
        targetId: a.id,
        clientCount: a.i,
        totalLifeMs: Math.round(c - a.G),
        heartbeatCount: a.g[b],
        clientLifeMs: Math.round(c - a.h[b])
    }
};
class Cb {
    constructor(a) {
        this.G = a;
        this.g = {};
        this.h = {};
        this.i = 0;
        this.id = String(Math.floor(Number.MAX_SAFE_INTEGER * Math.random()))
    }
}

function Db(a) {
    return a.performance && a.performance.now() || Date.now()
}
var Eb = function(a, b) {
    class c {
        constructor(d, e) {
            this.h = d;
            this.g = e;
            this.i = new Cb(Db(e))
        }
        K(d, e) {
            var f = d.clientId;
            if (d.type === 0) d.stats = Bb(this.i, f, Db(this.g)), e(d);
            else if (d.type === 1) try {
                this.h(d.command, g => {
                    d.result = g;
                    e(d)
                }, g => {
                    d.failure = g;
                    e(d)
                })
            } catch (g) {
                d.failure = {
                    failureType: 11,
                    data: g.toString()
                }, e(d)
            }
        }
    }
    return new c(a, b)
};
(new class {
    constructor(a) {
        this.g = a;
        var b = new Ab(a);
        this.h = Eb((c, d, e) => {
            vb(b, c, d, e)
        }, a)
    }
    init() {
        this.g.addEventListener("install", () => {
            this.g.skipWaiting()
        });
        this.g.addEventListener("activate", a => {
            a.waitUntil(this.g.clients.claim())
        });
        this.g.addEventListener("message", a => {
            var b = a.source;
            if (b) {
                var c = a.data,
                    d = new Promise(e => {
                        this.h.K(c, f => {
                            b.postMessage(f);
                            e(void 0)
                        })
                    });
                a.waitUntil(d)
            }
        })
    }
}(self)).init();