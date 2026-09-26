"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[1040],
	{
		14636: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("car", [
				[
					"path",
					{
						d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
						key: "5owen",
					},
				],
				["circle", { cx: "7", cy: "17", r: "2", key: "u2ysq9" }],
				["path", { d: "M9 17h6", key: "r8uit2" }],
				["circle", { cx: "17", cy: "17", r: "2", key: "axvx0g" }],
			]);
		},
		41585: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("triangle-alert", [
				[
					"path",
					{
						d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
						key: "wmoenq",
					},
				],
				["path", { d: "M12 9v4", key: "juzpu7" }],
				["path", { d: "M12 17h.01", key: "p32p05" }],
			]);
		},
		57518: (e, r, t) => {
			t.d(r, { B8: () => N, UC: () => V, bL: () => E, l9: () => T });
			var a = t(12115),
				n = t(70379),
				i = t(68599),
				o = t(83478),
				u = t(83935),
				l = t(99354),
				s = t(1933),
				d = t(98979),
				c = t(89971),
				h = t(95155),
				f = "Tabs",
				[p, v] = (0, i.A)(f, [o.RG]),
				y = (0, o.RG)(),
				[g, b] = p(f),
				m = a.forwardRef((e, r) => {
					let {
							__scopeTabs: t,
							value: a,
							onValueChange: n,
							defaultValue: i,
							orientation: o = "horizontal",
							dir: u,
							activationMode: p = "automatic",
							...v
						} = e,
						y = (0, s.jH)(u),
						[b, m] = (0, d.i)({
							prop: a,
							onChange: n,
							defaultProp: i ?? "",
							caller: f,
						});
					return (0, h.jsx)(g, {
						scope: t,
						baseId: (0, c.B)(),
						value: b,
						onValueChange: m,
						orientation: o,
						dir: y,
						activationMode: p,
						children: (0, h.jsx)(l.sG.div, {
							dir: y,
							"data-orientation": o,
							...v,
							ref: r,
						}),
					});
				});
			m.displayName = f;
			var w = "TabsList",
				k = a.forwardRef((e, r) => {
					let { __scopeTabs: t, loop: a = !0, ...n } = e,
						i = b(w, t),
						u = y(t);
					return (0, h.jsx)(o.bL, {
						asChild: !0,
						...u,
						orientation: i.orientation,
						dir: i.dir,
						loop: a,
						children: (0, h.jsx)(l.sG.div, {
							role: "tablist",
							"aria-orientation": i.orientation,
							...n,
							ref: r,
						}),
					});
				});
			k.displayName = w;
			var M = "TabsTrigger",
				x = a.forwardRef((e, r) => {
					let { __scopeTabs: t, value: a, disabled: i = !1, ...u } = e,
						s = b(M, t),
						d = y(t),
						c = R(s.baseId, a),
						f = j(s.baseId, a),
						p = a === s.value;
					return (0, h.jsx)(o.q7, {
						asChild: !0,
						...d,
						focusable: !i,
						active: p,
						children: (0, h.jsx)(l.sG.button, {
							type: "button",
							role: "tab",
							"aria-selected": p,
							"aria-controls": f,
							"data-state": p ? "active" : "inactive",
							"data-disabled": i ? "" : void 0,
							disabled: i,
							id: c,
							...u,
							ref: r,
							onMouseDown: (0, n.mK)(e.onMouseDown, (e) => {
								i || 0 !== e.button || !1 !== e.ctrlKey
									? e.preventDefault()
									: s.onValueChange(a);
							}),
							onKeyDown: (0, n.mK)(e.onKeyDown, (e) => {
								[" ", "Enter"].includes(e.key) && s.onValueChange(a);
							}),
							onFocus: (0, n.mK)(e.onFocus, () => {
								let e = "manual" !== s.activationMode;
								p || i || !e || s.onValueChange(a);
							}),
						}),
					});
				});
			x.displayName = M;
			var C = "TabsContent",
				A = a.forwardRef((e, r) => {
					let { __scopeTabs: t, value: n, forceMount: i, children: o, ...s } = e,
						d = b(C, t),
						c = R(d.baseId, n),
						f = j(d.baseId, n),
						p = n === d.value,
						v = a.useRef(p);
					return (
						a.useEffect(() => {
							let e = requestAnimationFrame(() => (v.current = !1));
							return () => cancelAnimationFrame(e);
						}, []),
						(0, h.jsx)(u.C, {
							present: i || p,
							children: ({ present: t }) =>
								(0, h.jsx)(l.sG.div, {
									"data-state": p ? "active" : "inactive",
									"data-orientation": d.orientation,
									role: "tabpanel",
									"aria-labelledby": c,
									hidden: !t,
									id: f,
									tabIndex: 0,
									...s,
									ref: r,
									style: {
										...e.style,
										animationDuration: v.current ? "0s" : void 0,
									},
									children: t && o,
								}),
						})
					);
				});
			function R(e, r) {
				return `${e}-trigger-${r}`;
			}
			function j(e, r) {
				return `${e}-content-${r}`;
			}
			A.displayName = C;
			var E = m,
				N = k,
				T = x,
				V = A;
		},
		59222: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("fuel", [
				[
					"path",
					{
						d: "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5",
						key: "1wtuz0",
					},
				],
				["path", { d: "M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16", key: "e09ifn" }],
				["path", { d: "M2 21h13", key: "1x0fut" }],
				["path", { d: "M3 9h11", key: "1p7c0w" }],
			]);
		},
		60504: (e, r, t) => {
			t.d(r, { A: () => l });
			var a = t(12115),
				n = t(90901),
				i = t(44855),
				o = t(12180);
			let u = o.r
					? (e) => {
							e();
					  }
					: a.startTransition,
				l = (0, n.Ht)(i.Ay, () => (e, r, t = {}) => {
					let { mutate: i } = (0, n.iX)(),
						l = (0, a.useRef)(e),
						s = (0, a.useRef)(r),
						d = (0, a.useRef)(t),
						c = (0, a.useRef)(0),
						[h, f, p] = ((e) => {
							let [, r] = (0, a.useState)({}),
								t = (0, a.useRef)(!1),
								n = (0, a.useRef)(e),
								i = (0, a.useRef)({ data: !1, error: !1, isValidating: !1 }),
								u = (0, a.useCallback)((e) => {
									let a = !1,
										o = n.current;
									for (let r in e)
										Object.prototype.hasOwnProperty.call(e, r) &&
											o[r] !== e[r] &&
											((o[r] = e[r]), i.current[r] && (a = !0));
									a && !t.current && r({});
								}, []);
							return (
								(0, o.u)(
									() => (
										(t.current = !1),
										() => {
											t.current = !0;
										}
									)
								),
								[n, i.current, u]
							);
						})({ data: o.U, error: o.U, isMutating: !1 }),
						v = h.current,
						y = (0, a.useCallback)(async (e, r) => {
							let [t, a] = (0, o.s)(l.current);
							if (!s.current)
								throw Error("Can’t trigger the mutation: missing fetcher.");
							if (!t) throw Error("Can’t trigger the mutation: missing key.");
							let n = (0, o.m)(
									(0, o.m)({ populateCache: !1, throwOnError: !0 }, d.current),
									r
								),
								h = (0, o.o)();
							(c.current = h), p({ isMutating: !0 });
							try {
								let r = await i(
									t,
									s.current(a, { arg: e }),
									(0, o.m)(n, { throwOnError: !0 })
								);
								return (
									c.current <= h &&
										(u(() => p({ data: r, isMutating: !1, error: void 0 })),
										null == n.onSuccess || n.onSuccess.call(n, r, t, n)),
									r
								);
							} catch (e) {
								if (
									c.current <= h &&
									(u(() => p({ error: e, isMutating: !1 })),
									null == n.onError || n.onError.call(n, e, t, n),
									n.throwOnError)
								)
									throw e;
							}
						}, []),
						g = (0, a.useCallback)(() => {
							(c.current = (0, o.o)()), p({ data: o.U, error: o.U, isMutating: !1 });
						}, []);
					return (
						(0, o.u)(() => {
							(l.current = e), (s.current = r), (d.current = t);
						}),
						{
							trigger: y,
							reset: g,
							get data() {
								return (f.data = !0), v.data;
							},
							get error() {
								return (f.error = !0), v.error;
							},
							get isMutating() {
								return (f.isMutating = !0), v.isMutating;
							},
						}
					);
				});
		},
		66669: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("gauge", [
				["path", { d: "m12 14 4-4", key: "9kzdfg" }],
				["path", { d: "M3.34 19a10 10 0 1 1 17.32 0", key: "19p75a" }],
			]);
		},
		81262: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("printer", [
				[
					"path",
					{
						d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
						key: "143wyd",
					},
				],
				["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6", key: "1itne7" }],
				["rect", { x: "6", y: "14", width: "12", height: "8", rx: "1", key: "1ue0tg" }],
			]);
		},
		89803: (e, r, t) => {
			t.d(r, { b: () => d });
			var a = t(12115);
			t(47650);
			var n = t(42442),
				i = t(95155),
				o = [
					"a",
					"button",
					"div",
					"form",
					"h2",
					"h3",
					"img",
					"input",
					"label",
					"li",
					"nav",
					"ol",
					"p",
					"select",
					"span",
					"svg",
					"ul",
				].reduce((e, r) => {
					let t = (0, n.TL)(`Primitive.${r}`),
						o = a.forwardRef((e, a) => {
							let { asChild: n, ...o } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, i.jsx)(n ? t : r, { ...o, ref: a })
							);
						});
					return (o.displayName = `Primitive.${r}`), { ...e, [r]: o };
				}, {}),
				u = "horizontal",
				l = ["horizontal", "vertical"],
				s = a.forwardRef((e, r) => {
					var t;
					let { decorative: a, orientation: n = u, ...s } = e,
						d = ((t = n), l.includes(t)) ? n : u;
					return (0, i.jsx)(o.div, {
						"data-orientation": d,
						...(a
							? { role: "none" }
							: {
									"aria-orientation": "vertical" === d ? d : void 0,
									role: "separator",
							  }),
						...s,
						ref: r,
					});
				});
			s.displayName = "Separator";
			var d = s;
		},
	},
]);
