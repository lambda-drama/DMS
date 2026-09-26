"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[9665],
	{
		284: (e, r, t) => {
			let a;
			t.d(r, {
				rc: () => H,
				ZD: () => I,
				UC: () => L,
				VY: () => V,
				hJ: () => _,
				ZL: () => S,
				bL: () => O,
				hE: () => P,
			});
			var n = t(12115),
				i = t(68599),
				o = t(47527),
				s = t(29483),
				l = t(70379),
				c = t(95155),
				d = Symbol("radix.slottable"),
				u = "AlertDialog",
				[h, p] = (0, i.A)(u, [s.Hs]),
				f = (0, s.Hs)(),
				y = (e) => {
					let { __scopeAlertDialog: r, ...t } = e,
						a = f(r);
					return (0, c.jsx)(s.bL, { ...a, ...t, modal: !0 });
				};
			(y.displayName = u),
				(n.forwardRef((e, r) => {
					let { __scopeAlertDialog: t, ...a } = e,
						n = f(t);
					return (0, c.jsx)(s.l9, { ...n, ...a, ref: r });
				}).displayName = "AlertDialogTrigger");
			var m = (e) => {
				let { __scopeAlertDialog: r, ...t } = e,
					a = f(r);
				return (0, c.jsx)(s.ZL, { ...a, ...t });
			};
			m.displayName = "AlertDialogPortal";
			var g = n.forwardRef((e, r) => {
				let { __scopeAlertDialog: t, ...a } = e,
					n = f(t);
				return (0, c.jsx)(s.hJ, { ...n, ...a, ref: r });
			});
			g.displayName = "AlertDialogOverlay";
			var k = "AlertDialogContent",
				[v, x] = h(k),
				b =
					(((a = ({ children: e }) =>
						(0, c.jsx)(c.Fragment, { children: e })).displayName =
						"AlertDialogContent.Slottable"),
					(a.__radixId = d),
					a),
				A = n.forwardRef((e, r) => {
					let { __scopeAlertDialog: t, children: a, ...i } = e,
						d = f(t),
						u = n.useRef(null),
						h = (0, o.s)(r, u),
						p = n.useRef(null);
					return (0, c.jsx)(s.G$, {
						contentName: k,
						titleName: w,
						docsSlug: "alert-dialog",
						children: (0, c.jsx)(v, {
							scope: t,
							cancelRef: p,
							children: (0, c.jsxs)(s.UC, {
								role: "alertdialog",
								...d,
								...i,
								ref: h,
								onOpenAutoFocus: (0, l.mK)(i.onOpenAutoFocus, (e) => {
									e.preventDefault(), p.current?.focus({ preventScroll: !0 });
								}),
								onPointerDownOutside: (e) => e.preventDefault(),
								onInteractOutside: (e) => e.preventDefault(),
								children: [
									(0, c.jsx)(b, { children: a }),
									(0, c.jsx)(N, { contentRef: u }),
								],
							}),
						}),
					});
				});
			A.displayName = k;
			var w = "AlertDialogTitle",
				j = n.forwardRef((e, r) => {
					let { __scopeAlertDialog: t, ...a } = e,
						n = f(t);
					return (0, c.jsx)(s.hE, { ...n, ...a, ref: r });
				});
			j.displayName = w;
			var M = "AlertDialogDescription",
				C = n.forwardRef((e, r) => {
					let { __scopeAlertDialog: t, ...a } = e,
						n = f(t);
					return (0, c.jsx)(s.VY, { ...n, ...a, ref: r });
				});
			C.displayName = M;
			var E = n.forwardRef((e, r) => {
				let { __scopeAlertDialog: t, ...a } = e,
					n = f(t);
				return (0, c.jsx)(s.bm, { ...n, ...a, ref: r });
			});
			E.displayName = "AlertDialogAction";
			var R = "AlertDialogCancel",
				D = n.forwardRef((e, r) => {
					let { __scopeAlertDialog: t, ...a } = e,
						{ cancelRef: n } = x(R, t),
						i = f(t),
						l = (0, o.s)(r, n);
					return (0, c.jsx)(s.bm, { ...i, ...a, ref: l });
				});
			D.displayName = R;
			var N = ({ contentRef: e }) => {
					let r = `\`${k}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${k}\` by passing a \`${M}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${k}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;
					return (
						n.useEffect(() => {
							document.getElementById(e.current?.getAttribute("aria-describedby")) ||
								console.warn(r);
						}, [r, e]),
						null
					);
				},
				O = y,
				S = m,
				_ = g,
				L = A,
				H = E,
				I = D,
				P = j,
				V = C;
		},
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
		21362: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("chevron-right", [
				["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }],
			]);
		},
		41641: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("chevron-left", [
				["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }],
			]);
		},
		42869: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("user", [
				["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
				["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }],
			]);
		},
		47279: (e, r, t) => {
			t.d(r, { C1: () => w, bL: () => b });
			var a = t(12115),
				n = t(47527),
				i = t(68599),
				o = t(70379),
				s = t(98979),
				l = t(83417),
				c = t(63509),
				d = t(83935),
				u = t(99354),
				h = t(95155),
				p = "Checkbox",
				[f, y] = (0, i.A)(p),
				[m, g] = f(p);
			function k(e) {
				let {
						__scopeCheckbox: r,
						checked: t,
						children: n,
						defaultChecked: i,
						disabled: o,
						form: l,
						name: c,
						onCheckedChange: d,
						required: u,
						value: f = "on",
						internal_do_not_use_render: y,
					} = e,
					[g, k] = (0, s.i)({ prop: t, defaultProp: i ?? !1, onChange: d, caller: p }),
					[v, x] = a.useState(null),
					[b, A] = a.useState(null),
					w = a.useRef(!1),
					j = !v || !!l || !!v.closest("form"),
					M = {
						checked: g,
						disabled: o,
						setChecked: k,
						control: v,
						setControl: x,
						name: c,
						form: l,
						value: f,
						hasConsumerStoppedPropagationRef: w,
						required: u,
						defaultChecked: !C(i) && i,
						isFormControl: j,
						bubbleInput: b,
						setBubbleInput: A,
					};
				return (0, h.jsx)(m, {
					scope: r,
					...M,
					children: "function" == typeof y ? y(M) : n,
				});
			}
			var v = "CheckboxTrigger",
				x = a.forwardRef(({ __scopeCheckbox: e, onKeyDown: r, onClick: t, ...i }, s) => {
					let {
							control: l,
							value: c,
							disabled: d,
							checked: p,
							required: f,
							setControl: y,
							setChecked: m,
							hasConsumerStoppedPropagationRef: k,
							isFormControl: x,
							bubbleInput: b,
						} = g(v, e),
						A = (0, n.s)(s, y),
						w = a.useRef(p);
					return (
						a.useEffect(() => {
							let e = l?.form;
							if (e) {
								let r = () => m(w.current);
								return (
									e.addEventListener("reset", r),
									() => e.removeEventListener("reset", r)
								);
							}
						}, [l, m]),
						(0, h.jsx)(u.sG.button, {
							type: "button",
							role: "checkbox",
							"aria-checked": C(p) ? "mixed" : p,
							"aria-required": f,
							"data-state": E(p),
							"data-disabled": d ? "" : void 0,
							disabled: d,
							value: c,
							...i,
							ref: A,
							onKeyDown: (0, o.mK)(r, (e) => {
								"Enter" === e.key && e.preventDefault();
							}),
							onClick: (0, o.mK)(t, (e) => {
								m((e) => !!C(e) || !e),
									b &&
										x &&
										((k.current = e.isPropagationStopped()),
										k.current || e.stopPropagation());
							}),
						})
					);
				});
			x.displayName = v;
			var b = a.forwardRef((e, r) => {
				let {
					__scopeCheckbox: t,
					name: a,
					checked: n,
					defaultChecked: i,
					required: o,
					disabled: s,
					value: l,
					onCheckedChange: c,
					form: d,
					...u
				} = e;
				return (0, h.jsx)(k, {
					__scopeCheckbox: t,
					checked: n,
					defaultChecked: i,
					disabled: s,
					required: o,
					onCheckedChange: c,
					name: a,
					form: d,
					value: l,
					internal_do_not_use_render: ({ isFormControl: e }) =>
						(0, h.jsxs)(h.Fragment, {
							children: [
								(0, h.jsx)(x, { ...u, ref: r, __scopeCheckbox: t }),
								e && (0, h.jsx)(M, { __scopeCheckbox: t }),
							],
						}),
				});
			});
			b.displayName = p;
			var A = "CheckboxIndicator",
				w = a.forwardRef((e, r) => {
					let { __scopeCheckbox: t, forceMount: a, ...n } = e,
						i = g(A, t);
					return (0, h.jsx)(d.C, {
						present: a || C(i.checked) || !0 === i.checked,
						children: (0, h.jsx)(u.sG.span, {
							"data-state": E(i.checked),
							"data-disabled": i.disabled ? "" : void 0,
							...n,
							ref: r,
							style: { pointerEvents: "none", ...e.style },
						}),
					});
				});
			w.displayName = A;
			var j = "CheckboxBubbleInput",
				M = a.forwardRef(({ __scopeCheckbox: e, ...r }, t) => {
					let {
							control: i,
							hasConsumerStoppedPropagationRef: o,
							checked: s,
							defaultChecked: d,
							required: p,
							disabled: f,
							name: y,
							value: m,
							form: k,
							bubbleInput: v,
							setBubbleInput: x,
						} = g(j, e),
						b = (0, n.s)(t, x),
						A = (0, l.Z)(s),
						w = (0, c.X)(i);
					a.useEffect(() => {
						if (!v) return;
						let e = Object.getOwnPropertyDescriptor(
								window.HTMLInputElement.prototype,
								"checked"
							).set,
							r = !o.current;
						if (A !== s && e) {
							let t = new Event("click", { bubbles: r });
							(v.indeterminate = C(s)), e.call(v, !C(s) && s), v.dispatchEvent(t);
						}
					}, [v, A, s, o]);
					let M = a.useRef(!C(s) && s);
					return (0, h.jsx)(u.sG.input, {
						type: "checkbox",
						"aria-hidden": !0,
						defaultChecked: d ?? M.current,
						required: p,
						disabled: f,
						name: y,
						value: m,
						form: k,
						...r,
						tabIndex: -1,
						ref: b,
						style: {
							...r.style,
							...w,
							position: "absolute",
							pointerEvents: "none",
							opacity: 0,
							margin: 0,
							transform: "translateX(-100%)",
						},
					});
				});
			function C(e) {
				return "indeterminate" === e;
			}
			function E(e) {
				return C(e) ? "indeterminate" : e ? "checked" : "unchecked";
			}
			M.displayName = j;
		},
		47339: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("file-spreadsheet", [
				[
					"path",
					{
						d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
						key: "1oefj6",
					},
				],
				["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
				["path", { d: "M8 13h2", key: "yr2amv" }],
				["path", { d: "M14 13h2", key: "un5t4a" }],
				["path", { d: "M8 17h2", key: "2yhykz" }],
				["path", { d: "M14 17h2", key: "10kma7" }],
			]);
		},
		49387: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("pencil", [
				[
					"path",
					{
						d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
						key: "1a8usu",
					},
				],
				["path", { d: "m15 5 4 4", key: "1mk7zo" }],
			]);
		},
		60504: (e, r, t) => {
			t.d(r, { A: () => l });
			var a = t(12115),
				n = t(90901),
				i = t(44855),
				o = t(12180);
			let s = o.r
					? (e) => {
							e();
					  }
					: a.startTransition,
				l = (0, n.Ht)(i.Ay, () => (e, r, t = {}) => {
					let { mutate: i } = (0, n.iX)(),
						l = (0, a.useRef)(e),
						c = (0, a.useRef)(r),
						d = (0, a.useRef)(t),
						u = (0, a.useRef)(0),
						[h, p, f] = ((e) => {
							let [, r] = (0, a.useState)({}),
								t = (0, a.useRef)(!1),
								n = (0, a.useRef)(e),
								i = (0, a.useRef)({ data: !1, error: !1, isValidating: !1 }),
								s = (0, a.useCallback)((e) => {
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
								[n, i.current, s]
							);
						})({ data: o.U, error: o.U, isMutating: !1 }),
						y = h.current,
						m = (0, a.useCallback)(async (e, r) => {
							let [t, a] = (0, o.s)(l.current);
							if (!c.current)
								throw Error("Can’t trigger the mutation: missing fetcher.");
							if (!t) throw Error("Can’t trigger the mutation: missing key.");
							let n = (0, o.m)(
									(0, o.m)({ populateCache: !1, throwOnError: !0 }, d.current),
									r
								),
								h = (0, o.o)();
							(u.current = h), f({ isMutating: !0 });
							try {
								let r = await i(
									t,
									c.current(a, { arg: e }),
									(0, o.m)(n, { throwOnError: !0 })
								);
								return (
									u.current <= h &&
										(s(() => f({ data: r, isMutating: !1, error: void 0 })),
										null == n.onSuccess || n.onSuccess.call(n, r, t, n)),
									r
								);
							} catch (e) {
								if (
									u.current <= h &&
									(s(() => f({ error: e, isMutating: !1 })),
									null == n.onError || n.onError.call(n, e, t, n),
									n.throwOnError)
								)
									throw e;
							}
						}, []),
						g = (0, a.useCallback)(() => {
							(u.current = (0, o.o)()), f({ data: o.U, error: o.U, isMutating: !1 });
						}, []);
					return (
						(0, o.u)(() => {
							(l.current = e), (c.current = r), (d.current = t);
						}),
						{
							trigger: m,
							reset: g,
							get data() {
								return (p.data = !0), y.data;
							},
							get error() {
								return (p.error = !0), y.error;
							},
							get isMutating() {
								return (p.isMutating = !0), y.isMutating;
							},
						}
					);
				});
		},
		61878: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		68459: (e, r, t) => {
			t.d(r, { A: () => a });
			let a = (0, t(90425).A)("trash-2", [
				["path", { d: "M10 11v6", key: "nco0om" }],
				["path", { d: "M14 11v6", key: "outv1u" }],
				["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
				["path", { d: "M3 6h18", key: "d0wm0j" }],
				["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }],
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
	},
]);
