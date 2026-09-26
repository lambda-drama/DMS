"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8967],
	{
		7810: (e, t, r) => {
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("users", [
				["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
				["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
				["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
				["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
			]);
		},
		47279: (e, t, r) => {
			r.d(t, { C1: () => C, bL: () => j });
			var a = r(12115),
				n = r(47527),
				d = r(68599),
				c = r(70379),
				s = r(98979),
				i = r(83417),
				o = r(63509),
				l = r(83935),
				u = r(99354),
				p = r(95155),
				h = "Checkbox",
				[k, f] = (0, d.A)(h),
				[y, m] = k(h);
			function v(e) {
				let {
						__scopeCheckbox: t,
						checked: r,
						children: n,
						defaultChecked: d,
						disabled: c,
						form: i,
						name: o,
						onCheckedChange: l,
						required: u,
						value: k = "on",
						internal_do_not_use_render: f,
					} = e,
					[m, v] = (0, s.i)({ prop: r, defaultProp: d ?? !1, onChange: l, caller: h }),
					[b, x] = a.useState(null),
					[j, w] = a.useState(null),
					C = a.useRef(!1),
					E = !b || !!i || !!b.closest("form"),
					g = {
						checked: m,
						disabled: c,
						setChecked: v,
						control: b,
						setControl: x,
						name: o,
						form: i,
						value: k,
						hasConsumerStoppedPropagationRef: C,
						required: u,
						defaultChecked: !M(d) && d,
						isFormControl: E,
						bubbleInput: j,
						setBubbleInput: w,
					};
				return (0, p.jsx)(y, {
					scope: t,
					...g,
					children: "function" == typeof f ? f(g) : n,
				});
			}
			var b = "CheckboxTrigger",
				x = a.forwardRef(({ __scopeCheckbox: e, onKeyDown: t, onClick: r, ...d }, s) => {
					let {
							control: i,
							value: o,
							disabled: l,
							checked: h,
							required: k,
							setControl: f,
							setChecked: y,
							hasConsumerStoppedPropagationRef: v,
							isFormControl: x,
							bubbleInput: j,
						} = m(b, e),
						w = (0, n.s)(s, f),
						C = a.useRef(h);
					return (
						a.useEffect(() => {
							let e = i?.form;
							if (e) {
								let t = () => y(C.current);
								return (
									e.addEventListener("reset", t),
									() => e.removeEventListener("reset", t)
								);
							}
						}, [i, y]),
						(0, p.jsx)(u.sG.button, {
							type: "button",
							role: "checkbox",
							"aria-checked": M(h) ? "mixed" : h,
							"aria-required": k,
							"data-state": A(h),
							"data-disabled": l ? "" : void 0,
							disabled: l,
							value: o,
							...d,
							ref: w,
							onKeyDown: (0, c.mK)(t, (e) => {
								"Enter" === e.key && e.preventDefault();
							}),
							onClick: (0, c.mK)(r, (e) => {
								y((e) => !!M(e) || !e),
									j &&
										x &&
										((v.current = e.isPropagationStopped()),
										v.current || e.stopPropagation());
							}),
						})
					);
				});
			x.displayName = b;
			var j = a.forwardRef((e, t) => {
				let {
					__scopeCheckbox: r,
					name: a,
					checked: n,
					defaultChecked: d,
					required: c,
					disabled: s,
					value: i,
					onCheckedChange: o,
					form: l,
					...u
				} = e;
				return (0, p.jsx)(v, {
					__scopeCheckbox: r,
					checked: n,
					defaultChecked: d,
					disabled: s,
					required: c,
					onCheckedChange: o,
					name: a,
					form: l,
					value: i,
					internal_do_not_use_render: ({ isFormControl: e }) =>
						(0, p.jsxs)(p.Fragment, {
							children: [
								(0, p.jsx)(x, { ...u, ref: t, __scopeCheckbox: r }),
								e && (0, p.jsx)(g, { __scopeCheckbox: r }),
							],
						}),
				});
			});
			j.displayName = h;
			var w = "CheckboxIndicator",
				C = a.forwardRef((e, t) => {
					let { __scopeCheckbox: r, forceMount: a, ...n } = e,
						d = m(w, r);
					return (0, p.jsx)(l.C, {
						present: a || M(d.checked) || !0 === d.checked,
						children: (0, p.jsx)(u.sG.span, {
							"data-state": A(d.checked),
							"data-disabled": d.disabled ? "" : void 0,
							...n,
							ref: t,
							style: { pointerEvents: "none", ...e.style },
						}),
					});
				});
			C.displayName = w;
			var E = "CheckboxBubbleInput",
				g = a.forwardRef(({ __scopeCheckbox: e, ...t }, r) => {
					let {
							control: d,
							hasConsumerStoppedPropagationRef: c,
							checked: s,
							defaultChecked: l,
							required: h,
							disabled: k,
							name: f,
							value: y,
							form: v,
							bubbleInput: b,
							setBubbleInput: x,
						} = m(E, e),
						j = (0, n.s)(r, x),
						w = (0, i.Z)(s),
						C = (0, o.X)(d);
					a.useEffect(() => {
						if (!b) return;
						let e = Object.getOwnPropertyDescriptor(
								window.HTMLInputElement.prototype,
								"checked"
							).set,
							t = !c.current;
						if (w !== s && e) {
							let r = new Event("click", { bubbles: t });
							(b.indeterminate = M(s)), e.call(b, !M(s) && s), b.dispatchEvent(r);
						}
					}, [b, w, s, c]);
					let g = a.useRef(!M(s) && s);
					return (0, p.jsx)(u.sG.input, {
						type: "checkbox",
						"aria-hidden": !0,
						defaultChecked: l ?? g.current,
						required: h,
						disabled: k,
						name: f,
						value: y,
						form: v,
						...t,
						tabIndex: -1,
						ref: j,
						style: {
							...t.style,
							...C,
							position: "absolute",
							pointerEvents: "none",
							opacity: 0,
							margin: 0,
							transform: "translateX(-100%)",
						},
					});
				});
			function M(e) {
				return "indeterminate" === e;
			}
			function A(e) {
				return M(e) ? "indeterminate" : e ? "checked" : "unchecked";
			}
			g.displayName = E;
		},
		49387: (e, t, r) => {
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("pencil", [
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
		61878: (e, t, r) => {
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		68459: (e, t, r) => {
			r.d(t, { A: () => a });
			let a = (0, r(90425).A)("trash-2", [
				["path", { d: "M10 11v6", key: "nco0om" }],
				["path", { d: "M14 11v6", key: "outv1u" }],
				["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
				["path", { d: "M3 6h18", key: "d0wm0j" }],
				["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }],
			]);
		},
	},
]);
