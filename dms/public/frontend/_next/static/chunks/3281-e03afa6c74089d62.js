"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[3281, 3702],
	{
		6296: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("loader-circle", [
				["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }],
			]);
		},
		19820: (e, t, r) => {
			r.d(t, { Ke: () => w, R6: () => A, bL: () => R });
			var n = r(12115),
				a = r(70379),
				i = r(68599),
				o = r(98979),
				l = r(66294),
				u = r(47527),
				d = r(99354),
				s = r(83935),
				c = r(89971),
				p = r(95155),
				m = "Collapsible",
				[f, h] = (0, i.A)(m),
				[y, v] = f(m),
				k = n.forwardRef((e, t) => {
					let {
							__scopeCollapsible: r,
							open: a,
							defaultOpen: i,
							disabled: l,
							onOpenChange: u,
							...s
						} = e,
						[f, h] = (0, o.i)({
							prop: a,
							defaultProp: i ?? !1,
							onChange: u,
							caller: m,
						});
					return (0, p.jsx)(y, {
						scope: r,
						disabled: l,
						contentId: (0, c.B)(),
						open: f,
						onOpenToggle: n.useCallback(() => h((e) => !e), [h]),
						children: (0, p.jsx)(d.sG.div, {
							"data-state": b(f),
							"data-disabled": l ? "" : void 0,
							...s,
							ref: t,
						}),
					});
				});
			k.displayName = m;
			var g = "CollapsibleTrigger",
				A = n.forwardRef((e, t) => {
					let { __scopeCollapsible: r, ...n } = e,
						i = v(g, r);
					return (0, p.jsx)(d.sG.button, {
						type: "button",
						"aria-controls": i.contentId,
						"aria-expanded": i.open || !1,
						"data-state": b(i.open),
						"data-disabled": i.disabled ? "" : void 0,
						disabled: i.disabled,
						...n,
						ref: t,
						onClick: (0, a.mK)(e.onClick, i.onOpenToggle),
					});
				});
			A.displayName = g;
			var M = "CollapsibleContent",
				w = n.forwardRef((e, t) => {
					let { forceMount: r, ...n } = e,
						a = v(M, e.__scopeCollapsible);
					return (0, p.jsx)(s.C, {
						present: r || a.open,
						children: ({ present: e }) => (0, p.jsx)(N, { ...n, ref: t, present: e }),
					});
				});
			w.displayName = M;
			var N = n.forwardRef((e, t) => {
				let { __scopeCollapsible: r, present: a, children: i, ...o } = e,
					s = v(M, r),
					[c, m] = n.useState(a),
					f = n.useRef(null),
					h = (0, u.s)(t, f),
					y = n.useRef(0),
					k = y.current,
					g = n.useRef(0),
					A = g.current,
					w = s.open || c,
					N = n.useRef(w),
					R = n.useRef(void 0);
				return (
					n.useEffect(() => {
						let e = requestAnimationFrame(() => (N.current = !1));
						return () => cancelAnimationFrame(e);
					}, []),
					(0, l.N)(() => {
						let e = f.current;
						if (e) {
							(R.current = R.current || {
								transitionDuration: e.style.transitionDuration,
								animationName: e.style.animationName,
							}),
								(e.style.transitionDuration = "0s"),
								(e.style.animationName = "none");
							let t = e.getBoundingClientRect();
							(y.current = t.height),
								(g.current = t.width),
								N.current ||
									((e.style.transitionDuration = R.current.transitionDuration),
									(e.style.animationName = R.current.animationName)),
								m(a);
						}
					}, [s.open, a]),
					(0, p.jsx)(d.sG.div, {
						"data-state": b(s.open),
						"data-disabled": s.disabled ? "" : void 0,
						id: s.contentId,
						hidden: !w,
						...o,
						ref: h,
						style: {
							"--radix-collapsible-content-height": k ? `${k}px` : void 0,
							"--radix-collapsible-content-width": A ? `${A}px` : void 0,
							...e.style,
						},
						children: w && i,
					})
				);
			});
			function b(e) {
				return e ? "open" : "closed";
			}
			var R = k;
		},
		24642: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("package", [
				[
					"path",
					{
						d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
						key: "1a0edw",
					},
				],
				["path", { d: "M12 22V12", key: "d0xqtd" }],
				["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }],
				["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }],
			]);
		},
		33210: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("x", [
				["path", { d: "M18 6 6 18", key: "1bl5f8" }],
				["path", { d: "m6 6 12 12", key: "d8bk6v" }],
			]);
		},
		41585: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("triangle-alert", [
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
		45752: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("arrow-down-up", [
				["path", { d: "m3 16 4 4 4-4", key: "1co6wj" }],
				["path", { d: "M7 20V4", key: "1yoxec" }],
				["path", { d: "m21 8-4-4-4 4", key: "1c9v7m" }],
				["path", { d: "M17 4v16", key: "7dpous" }],
			]);
		},
		51914: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("plus", [
				["path", { d: "M5 12h14", key: "1ays0h" }],
				["path", { d: "M12 5v14", key: "s699le" }],
			]);
		},
		56563: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("chevrons-up-down", [
				["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
				["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }],
			]);
		},
		60504: (e, t, r) => {
			r.d(t, { A: () => u });
			var n = r(12115),
				a = r(90901),
				i = r(44855),
				o = r(12180);
			let l = o.r
					? (e) => {
							e();
					  }
					: n.startTransition,
				u = (0, a.Ht)(i.Ay, () => (e, t, r = {}) => {
					let { mutate: i } = (0, a.iX)(),
						u = (0, n.useRef)(e),
						d = (0, n.useRef)(t),
						s = (0, n.useRef)(r),
						c = (0, n.useRef)(0),
						[p, m, f] = ((e) => {
							let [, t] = (0, n.useState)({}),
								r = (0, n.useRef)(!1),
								a = (0, n.useRef)(e),
								i = (0, n.useRef)({ data: !1, error: !1, isValidating: !1 }),
								l = (0, n.useCallback)((e) => {
									let n = !1,
										o = a.current;
									for (let t in e)
										Object.prototype.hasOwnProperty.call(e, t) &&
											o[t] !== e[t] &&
											((o[t] = e[t]), i.current[t] && (n = !0));
									n && !r.current && t({});
								}, []);
							return (
								(0, o.u)(
									() => (
										(r.current = !1),
										() => {
											r.current = !0;
										}
									)
								),
								[a, i.current, l]
							);
						})({ data: o.U, error: o.U, isMutating: !1 }),
						h = p.current,
						y = (0, n.useCallback)(async (e, t) => {
							let [r, n] = (0, o.s)(u.current);
							if (!d.current)
								throw Error("Can’t trigger the mutation: missing fetcher.");
							if (!r) throw Error("Can’t trigger the mutation: missing key.");
							let a = (0, o.m)(
									(0, o.m)({ populateCache: !1, throwOnError: !0 }, s.current),
									t
								),
								p = (0, o.o)();
							(c.current = p), f({ isMutating: !0 });
							try {
								let t = await i(
									r,
									d.current(n, { arg: e }),
									(0, o.m)(a, { throwOnError: !0 })
								);
								return (
									c.current <= p &&
										(l(() => f({ data: t, isMutating: !1, error: void 0 })),
										null == a.onSuccess || a.onSuccess.call(a, t, r, a)),
									t
								);
							} catch (e) {
								if (
									c.current <= p &&
									(l(() => f({ error: e, isMutating: !1 })),
									null == a.onError || a.onError.call(a, e, r, a),
									a.throwOnError)
								)
									throw e;
							}
						}, []),
						v = (0, n.useCallback)(() => {
							(c.current = (0, o.o)()), f({ data: o.U, error: o.U, isMutating: !1 });
						}, []);
					return (
						(0, o.u)(() => {
							(u.current = e), (d.current = t), (s.current = r);
						}),
						{
							trigger: y,
							reset: v,
							get data() {
								return (m.data = !0), h.data;
							},
							get error() {
								return (m.error = !0), h.error;
							},
							get isMutating() {
								return (m.isMutating = !0), h.isMutating;
							},
						}
					);
				});
		},
		66088: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("chevron-down", [
				["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }],
			]);
		},
		67514: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("trending-down", [
				["path", { d: "M16 17h6v-6", key: "t6n2it" }],
				["path", { d: "m22 17-8.5-8.5-5 5L2 7", key: "x473p" }],
			]);
		},
		83935: (e, t, r) => {
			r.d(t, { C: () => o });
			var n = r(12115),
				a = r(47527),
				i = r(66294),
				o = (e) => {
					var t;
					let r,
						o,
						{ present: u, children: d } = e,
						s = (function (e) {
							var t, r;
							let [a, o] = n.useState(),
								u = n.useRef(null),
								d = n.useRef(e),
								s = n.useRef("none"),
								[c, p] =
									((t = e ? "mounted" : "unmounted"),
									(r = {
										mounted: {
											UNMOUNT: "unmounted",
											ANIMATION_OUT: "unmountSuspended",
										},
										unmountSuspended: {
											MOUNT: "mounted",
											ANIMATION_END: "unmounted",
										},
										unmounted: { MOUNT: "mounted" },
									}),
									n.useReducer((e, t) => r[e][t] ?? e, t));
							return (
								n.useEffect(() => {
									let e = l(u.current);
									s.current = "mounted" === c ? e : "none";
								}, [c]),
								(0, i.N)(() => {
									let t = u.current,
										r = d.current;
									if (r !== e) {
										let n = s.current,
											a = l(t);
										e
											? p("MOUNT")
											: "none" === a || t?.display === "none"
											? p("UNMOUNT")
											: r && n !== a
											? p("ANIMATION_OUT")
											: p("UNMOUNT"),
											(d.current = e);
									}
								}, [e, p]),
								(0, i.N)(() => {
									if (a) {
										let e,
											t = a.ownerDocument.defaultView ?? window,
											r = (r) => {
												let n = l(u.current).includes(
													CSS.escape(r.animationName)
												);
												if (
													r.target === a &&
													n &&
													(p("ANIMATION_END"), !d.current)
												) {
													let r = a.style.animationFillMode;
													(a.style.animationFillMode = "forwards"),
														(e = t.setTimeout(() => {
															"forwards" ===
																a.style.animationFillMode &&
																(a.style.animationFillMode = r);
														}));
												}
											},
											n = (e) => {
												e.target === a && (s.current = l(u.current));
											};
										return (
											a.addEventListener("animationstart", n),
											a.addEventListener("animationcancel", r),
											a.addEventListener("animationend", r),
											() => {
												t.clearTimeout(e),
													a.removeEventListener("animationstart", n),
													a.removeEventListener("animationcancel", r),
													a.removeEventListener("animationend", r);
											}
										);
									}
									p("ANIMATION_END");
								}, [a, p]),
								{
									isPresent: ["mounted", "unmountSuspended"].includes(c),
									ref: n.useCallback((e) => {
										(u.current = e ? getComputedStyle(e) : null), o(e);
									}, []),
								}
							);
						})(u),
						c =
							"function" == typeof d
								? d({ present: s.isPresent })
								: n.Children.only(d),
						p = (0, a.s)(
							s.ref,
							((t = c),
							(o =
								(r = Object.getOwnPropertyDescriptor(t.props, "ref")?.get) &&
								"isReactWarning" in r &&
								r.isReactWarning)
								? t.ref
								: (o =
										(r = Object.getOwnPropertyDescriptor(t, "ref")?.get) &&
										"isReactWarning" in r &&
										r.isReactWarning)
								? t.props.ref
								: t.props.ref || t.ref)
						);
					return "function" == typeof d || s.isPresent
						? n.cloneElement(c, { ref: p })
						: null;
				};
			function l(e) {
				return e?.animationName || "none";
			}
			o.displayName = "Presence";
		},
		89123: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("chart-column", [
				["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
				["path", { d: "M18 17V9", key: "2bz60n" }],
				["path", { d: "M13 17V5", key: "1frdt8" }],
				["path", { d: "M8 17v-3", key: "17ska0" }],
			]);
		},
		91760: (e, t, r) => {
			r.d(t, { b: () => u });
			var n = r(12115);
			r(47650);
			var a = r(42442),
				i = r(95155),
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
				].reduce((e, t) => {
					let r = (0, a.TL)(`Primitive.${t}`),
						o = n.forwardRef((e, n) => {
							let { asChild: a, ...o } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, i.jsx)(a ? r : t, { ...o, ref: n })
							);
						});
					return (o.displayName = `Primitive.${t}`), { ...e, [t]: o };
				}, {}),
				l = n.forwardRef((e, t) =>
					(0, i.jsx)(o.label, {
						...e,
						ref: t,
						onMouseDown: (t) => {
							t.target.closest("button, input, select, textarea") ||
								(e.onMouseDown?.(t),
								!t.defaultPrevented && t.detail > 1 && t.preventDefault());
						},
					})
				);
			l.displayName = "Label";
			var u = l;
		},
		91958: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("refresh-cw", [
				[
					"path",
					{ d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" },
				],
				["path", { d: "M21 3v5h-5", key: "1q7to0" }],
				[
					"path",
					{ d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" },
				],
				["path", { d: "M8 16H3v5", key: "1cv678" }],
			]);
		},
		92622: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("funnel", [
				[
					"path",
					{
						d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",
						key: "sc7q7i",
					},
				],
			]);
		},
		94514: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
		},
		97810: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("book-open", [
				["path", { d: "M12 7v14", key: "1akyts" }],
				[
					"path",
					{
						d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
						key: "ruj8y",
					},
				],
			]);
		},
	},
]);
