"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[3777, 6158],
	{
		12651: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("circle-check", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
			]);
		},
		13545: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("circle-alert", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
				["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
			]);
		},
		33210: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("x", [
				["path", { d: "M18 6 6 18", key: "1bl5f8" }],
				["path", { d: "m6 6 12 12", key: "d8bk6v" }],
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
		57518: (e, t, r) => {
			r.d(t, { B8: () => K, UC: () => T, bL: () => I, l9: () => C });
			var n = r(12115),
				a = r(70379),
				o = r(68599),
				i = r(83478),
				l = r(83935),
				s = r(99354),
				u = r(1933),
				c = r(98979),
				d = r(89971),
				f = r(95155),
				p = "Tabs",
				[v, m] = (0, o.A)(p, [i.RG]),
				b = (0, i.RG)(),
				[h, y] = v(p),
				w = n.forwardRef((e, t) => {
					let {
							__scopeTabs: r,
							value: n,
							onValueChange: a,
							defaultValue: o,
							orientation: i = "horizontal",
							dir: l,
							activationMode: v = "automatic",
							...m
						} = e,
						b = (0, u.jH)(l),
						[y, w] = (0, c.i)({
							prop: n,
							onChange: a,
							defaultProp: o ?? "",
							caller: p,
						});
					return (0, f.jsx)(h, {
						scope: r,
						baseId: (0, d.B)(),
						value: y,
						onValueChange: w,
						orientation: i,
						dir: b,
						activationMode: v,
						children: (0, f.jsx)(s.sG.div, {
							dir: b,
							"data-orientation": i,
							...m,
							ref: t,
						}),
					});
				});
			w.displayName = p;
			var g = "TabsList",
				x = n.forwardRef((e, t) => {
					let { __scopeTabs: r, loop: n = !0, ...a } = e,
						o = y(g, r),
						l = b(r);
					return (0, f.jsx)(i.bL, {
						asChild: !0,
						...l,
						orientation: o.orientation,
						dir: o.dir,
						loop: n,
						children: (0, f.jsx)(s.sG.div, {
							role: "tablist",
							"aria-orientation": o.orientation,
							...a,
							ref: t,
						}),
					});
				});
			x.displayName = g;
			var A = "TabsTrigger",
				k = n.forwardRef((e, t) => {
					let { __scopeTabs: r, value: n, disabled: o = !1, ...l } = e,
						u = y(A, r),
						c = b(r),
						d = j(u.baseId, n),
						p = F(u.baseId, n),
						v = n === u.value;
					return (0, f.jsx)(i.q7, {
						asChild: !0,
						...c,
						focusable: !o,
						active: v,
						children: (0, f.jsx)(s.sG.button, {
							type: "button",
							role: "tab",
							"aria-selected": v,
							"aria-controls": p,
							"data-state": v ? "active" : "inactive",
							"data-disabled": o ? "" : void 0,
							disabled: o,
							id: d,
							...l,
							ref: t,
							onMouseDown: (0, a.mK)(e.onMouseDown, (e) => {
								o || 0 !== e.button || !1 !== e.ctrlKey
									? e.preventDefault()
									: u.onValueChange(n);
							}),
							onKeyDown: (0, a.mK)(e.onKeyDown, (e) => {
								[" ", "Enter"].includes(e.key) && u.onValueChange(n);
							}),
							onFocus: (0, a.mK)(e.onFocus, () => {
								let e = "manual" !== u.activationMode;
								v || o || !e || u.onValueChange(n);
							}),
						}),
					});
				});
			k.displayName = A;
			var R = "TabsContent",
				D = n.forwardRef((e, t) => {
					let { __scopeTabs: r, value: a, forceMount: o, children: i, ...u } = e,
						c = y(R, r),
						d = j(c.baseId, a),
						p = F(c.baseId, a),
						v = a === c.value,
						m = n.useRef(v);
					return (
						n.useEffect(() => {
							let e = requestAnimationFrame(() => (m.current = !1));
							return () => cancelAnimationFrame(e);
						}, []),
						(0, f.jsx)(l.C, {
							present: o || v,
							children: ({ present: r }) =>
								(0, f.jsx)(s.sG.div, {
									"data-state": v ? "active" : "inactive",
									"data-orientation": c.orientation,
									role: "tabpanel",
									"aria-labelledby": d,
									hidden: !r,
									id: p,
									tabIndex: 0,
									...u,
									ref: t,
									style: {
										...e.style,
										animationDuration: m.current ? "0s" : void 0,
									},
									children: r && i,
								}),
						})
					);
				});
			function j(e, t) {
				return `${e}-trigger-${t}`;
			}
			function F(e, t) {
				return `${e}-content-${t}`;
			}
			D.displayName = R;
			var I = w,
				K = x,
				C = k,
				T = D;
		},
		83478: (e, t, r) => {
			r.d(t, { RG: () => x, bL: () => C, q7: () => T });
			var n = r(12115),
				a = r(70379),
				o = r(64831),
				i = r(47527),
				l = r(68599),
				s = r(89971),
				u = r(99354),
				c = r(17347),
				d = r(98979),
				f = r(1933),
				p = r(95155),
				v = "rovingFocusGroup.onEntryFocus",
				m = { bubbles: !1, cancelable: !0 },
				b = "RovingFocusGroup",
				[h, y, w] = (0, o.N)(b),
				[g, x] = (0, l.A)(b, [w]),
				[A, k] = g(b),
				R = n.forwardRef((e, t) =>
					(0, p.jsx)(h.Provider, {
						scope: e.__scopeRovingFocusGroup,
						children: (0, p.jsx)(h.Slot, {
							scope: e.__scopeRovingFocusGroup,
							children: (0, p.jsx)(D, { ...e, ref: t }),
						}),
					})
				);
			R.displayName = b;
			var D = n.forwardRef((e, t) => {
					let {
							__scopeRovingFocusGroup: r,
							orientation: o,
							loop: l = !1,
							dir: s,
							currentTabStopId: h,
							defaultCurrentTabStopId: w,
							onCurrentTabStopIdChange: g,
							onEntryFocus: x,
							preventScrollOnEntryFocus: k = !1,
							...R
						} = e,
						D = n.useRef(null),
						j = (0, i.s)(t, D),
						F = (0, f.jH)(s),
						[I, C] = (0, d.i)({
							prop: h,
							defaultProp: w ?? null,
							onChange: g,
							caller: b,
						}),
						[T, E] = n.useState(!1),
						G = (0, c.c)(x),
						M = y(r),
						L = n.useRef(!1),
						[N, S] = n.useState(0);
					return (
						n.useEffect(() => {
							let e = D.current;
							if (e)
								return e.addEventListener(v, G), () => e.removeEventListener(v, G);
						}, [G]),
						(0, p.jsx)(A, {
							scope: r,
							orientation: o,
							dir: F,
							loop: l,
							currentTabStopId: I,
							onItemFocus: n.useCallback((e) => C(e), [C]),
							onItemShiftTab: n.useCallback(() => E(!0), []),
							onFocusableItemAdd: n.useCallback(() => S((e) => e + 1), []),
							onFocusableItemRemove: n.useCallback(() => S((e) => e - 1), []),
							children: (0, p.jsx)(u.sG.div, {
								tabIndex: T || 0 === N ? -1 : 0,
								"data-orientation": o,
								...R,
								ref: j,
								style: { outline: "none", ...e.style },
								onMouseDown: (0, a.mK)(e.onMouseDown, () => {
									L.current = !0;
								}),
								onFocus: (0, a.mK)(e.onFocus, (e) => {
									let t = !L.current;
									if (e.target === e.currentTarget && t && !T) {
										let t = new CustomEvent(v, m);
										if (
											(e.currentTarget.dispatchEvent(t), !t.defaultPrevented)
										) {
											let e = M().filter((e) => e.focusable);
											K(
												[
													e.find((e) => e.active),
													e.find((e) => e.id === I),
													...e,
												]
													.filter(Boolean)
													.map((e) => e.ref.current),
												k
											);
										}
									}
									L.current = !1;
								}),
								onBlur: (0, a.mK)(e.onBlur, () => E(!1)),
							}),
						})
					);
				}),
				j = "RovingFocusGroupItem",
				F = n.forwardRef((e, t) => {
					let {
							__scopeRovingFocusGroup: r,
							focusable: o = !0,
							active: i = !1,
							tabStopId: l,
							children: c,
							...d
						} = e,
						f = (0, s.B)(),
						v = l || f,
						m = k(j, r),
						b = m.currentTabStopId === v,
						w = y(r),
						{
							onFocusableItemAdd: g,
							onFocusableItemRemove: x,
							currentTabStopId: A,
						} = m;
					return (
						n.useEffect(() => {
							if (o) return g(), () => x();
						}, [o, g, x]),
						(0, p.jsx)(h.ItemSlot, {
							scope: r,
							id: v,
							focusable: o,
							active: i,
							children: (0, p.jsx)(u.sG.span, {
								tabIndex: b ? 0 : -1,
								"data-orientation": m.orientation,
								...d,
								ref: t,
								onMouseDown: (0, a.mK)(e.onMouseDown, (e) => {
									o ? m.onItemFocus(v) : e.preventDefault();
								}),
								onFocus: (0, a.mK)(e.onFocus, () => m.onItemFocus(v)),
								onKeyDown: (0, a.mK)(e.onKeyDown, (e) => {
									if ("Tab" === e.key && e.shiftKey)
										return void m.onItemShiftTab();
									if (e.target !== e.currentTarget) return;
									let t = (function (e, t, r) {
										var n;
										let a =
											((n = e.key),
											"rtl" !== r
												? n
												: "ArrowLeft" === n
												? "ArrowRight"
												: "ArrowRight" === n
												? "ArrowLeft"
												: n);
										if (
											!(
												"vertical" === t &&
												["ArrowLeft", "ArrowRight"].includes(a)
											) &&
											!(
												"horizontal" === t &&
												["ArrowUp", "ArrowDown"].includes(a)
											)
										)
											return I[a];
									})(e, m.orientation, m.dir);
									if (void 0 !== t) {
										if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey)
											return;
										e.preventDefault();
										let a = w()
											.filter((e) => e.focusable)
											.map((e) => e.ref.current);
										if ("last" === t) a.reverse();
										else if ("prev" === t || "next" === t) {
											var r, n;
											"prev" === t && a.reverse();
											let o = a.indexOf(e.currentTarget);
											a = m.loop
												? ((r = a),
												  (n = o + 1),
												  r.map((e, t) => r[(n + t) % r.length]))
												: a.slice(o + 1);
										}
										setTimeout(() => K(a));
									}
								}),
								children:
									"function" == typeof c
										? c({ isCurrentTabStop: b, hasTabStop: null != A })
										: c,
							}),
						})
					);
				});
			F.displayName = j;
			var I = {
				ArrowLeft: "prev",
				ArrowUp: "prev",
				ArrowRight: "next",
				ArrowDown: "next",
				PageUp: "first",
				Home: "first",
				PageDown: "last",
				End: "last",
			};
			function K(e, t = !1) {
				let r = document.activeElement;
				for (let n of e)
					if (n === r || (n.focus({ preventScroll: t }), document.activeElement !== r))
						return;
			}
			var C = R,
				T = F;
		},
		91760: (e, t, r) => {
			r.d(t, { b: () => s });
			var n = r(12115);
			r(47650);
			var a = r(42442),
				o = r(95155),
				i = [
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
						i = n.forwardRef((e, n) => {
							let { asChild: a, ...i } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, o.jsx)(a ? r : t, { ...i, ref: n })
							);
						});
					return (i.displayName = `Primitive.${t}`), { ...e, [t]: i };
				}, {}),
				l = n.forwardRef((e, t) =>
					(0, o.jsx)(i.label, {
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
			var s = l;
		},
		94514: (e, t, r) => {
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
		},
	},
]);
