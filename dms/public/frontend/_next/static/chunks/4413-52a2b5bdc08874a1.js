"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4413],
	{
		13175: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("ban", [
				["path", { d: "M4.929 4.929 19.07 19.071", key: "196cmz" }],
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
			]);
		},
		20953: (e, t, s) => {
			s.d(t, {
				CM: () => a,
				FA: () => o,
				Ze: () => n,
				ih: () => c,
				mC: () => l,
				ms: () => i,
			});
			let a = new Set(["Completed", "Cancelled", "No-Show"]),
				n = new Set([
					"Arrived",
					"In Inspection",
					"In Workshop",
					"Ready for Pickup",
					"Completed",
				]),
				r = new Set(["Requested", "Scheduled", "Confirmed", "Booked", "Rescheduled"]);
			function l(e) {
				let t = Number(e);
				return Number.isFinite(t) ? t : 0;
			}
			function i(e) {
				return (e.contact_phone || e.primary_phone || e.mobile_no || "").trim();
			}
			function d(e) {
				return r.has(e || "");
			}
			function c(e) {
				return !d(e.status) || a.has(e.status) || n.has(e.status)
					? null
					: 1 !== l(e.docstatus)
					? "Confirm the appointment first"
					: i(e)
					? null
					: "Add Mobile No on the appointment or a phone on the customer";
			}
			function o(e) {
				return !(!d(e.status) || a.has(e.status) || n.has(e.status)) && 2 > l(e.docstatus);
			}
		},
		21362: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("chevron-right", [
				["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }],
			]);
		},
		28063: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("calendar-clock", [
				["path", { d: "M16 14v2.2l1.6 1", key: "fo4ql5" }],
				["path", { d: "M16 2v4", key: "4m81vk" }],
				[
					"path",
					{
						d: "M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5",
						key: "1osxxc",
					},
				],
				["path", { d: "M3 10h5", key: "r794hk" }],
				["path", { d: "M8 2v4", key: "1cmpym" }],
				["circle", { cx: "16", cy: "16", r: "6", key: "qoo3c4" }],
			]);
		},
		33745: (e, t, s) => {
			s.d(t, { l: () => d });
			var a = s(95155),
				n = s(51914),
				r = s(63360),
				l = s(4474),
				i = s(91337);
			function d({ module: e, label: t, className: s, ...c }) {
				let { canCreate: o } = (0, r.Sk)();
				return o(e)
					? (0, a.jsxs)(l.$, {
							"aria-label": t,
							title: t,
							className: (0, i.cn)(
								"h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2",
								s
							),
							...c,
							children: [
								(0, a.jsx)(n.A, { className: "h-4 w-4 shrink-0" }),
								(0, a.jsx)("span", {
									className: "hidden sm:inline sm:ml-2",
									children: t,
								}),
							],
					  })
					: null;
			}
		},
		38399: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("file-pen-line", [
				[
					"path",
					{
						d: "m18.226 5.226-2.52-2.52A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.351",
						key: "1k2beg",
					},
				],
				[
					"path",
					{
						d: "M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z",
						key: "2t3380",
					},
				],
				["path", { d: "M8 18h1", key: "13wk12" }],
			]);
		},
		41641: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("chevron-left", [
				["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }],
			]);
		},
		60285: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("ellipsis", [
				["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
				["circle", { cx: "19", cy: "12", r: "1", key: "1wjl8i" }],
				["circle", { cx: "5", cy: "12", r: "1", key: "1pcz8c" }],
			]);
		},
		61878: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		61991: (e, t, s) => {
			s.d(t, { w: () => l });
			var a = s(95155);
			s(12115);
			var n = s(89803),
				r = s(91337);
			function l({ className: e, orientation: t = "horizontal", decorative: s = !0, ...i }) {
				return (0, a.jsx)(n.b, {
					"data-slot": "separator",
					decorative: s,
					orientation: t,
					className: (0, r.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...i,
				});
			}
		},
		62791: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("circle-x", [
				["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
				["path", { d: "m15 9-6 6", key: "1uzhvr" }],
				["path", { d: "m9 9 6 6", key: "z0biqf" }],
			]);
		},
		70521: (e, t, s) => {
			s.d(t, {
				$v: () => x,
				EO: () => o,
				Lt: () => i,
				Rx: () => p,
				Zr: () => j,
				ck: () => u,
				r7: () => h,
				wd: () => m,
			});
			var a = s(95155);
			s(12115);
			var n = s(284),
				r = s(91337),
				l = s(4474);
			function i({ ...e }) {
				return (0, a.jsx)(n.bL, { "data-slot": "alert-dialog", ...e });
			}
			function d({ ...e }) {
				return (0, a.jsx)(n.ZL, { "data-slot": "alert-dialog-portal", ...e });
			}
			function c({ className: e, ...t }) {
				return (0, a.jsx)(n.hJ, {
					"data-slot": "alert-dialog-overlay",
					className: (0, r.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, a.jsxs)(d, {
					children: [
						(0, a.jsx)(c, {}),
						(0, a.jsx)(n.UC, {
							"data-slot": "alert-dialog-content",
							className: (0, r.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
								e
							),
							...t,
						}),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "alert-dialog-header",
					className: (0, r.cn)("flex flex-col gap-2 text-center sm:text-left", e),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "alert-dialog-footer",
					className: (0, r.cn)(
						"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
						e
					),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, a.jsx)(n.hE, {
					"data-slot": "alert-dialog-title",
					className: (0, r.cn)("text-lg font-semibold", e),
					...t,
				});
			}
			function x({ className: e, ...t }) {
				return (0, a.jsx)(n.VY, {
					"data-slot": "alert-dialog-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function p({ className: e, ...t }) {
				return (0, a.jsx)(n.rc, { className: (0, r.cn)((0, l.r)(), e), ...t });
			}
			function j({ className: e, ...t }) {
				return (0, a.jsx)(n.ZD, {
					className: (0, r.cn)((0, l.r)({ variant: "outline" }), e),
					...t,
				});
			}
		},
		79984: (e, t, s) => {
			s.d(t, { BT: () => d, Wu: () => c, ZB: () => i, Zp: () => r, aR: () => l });
			var a = s(95155);
			s(12115);
			var n = s(91337);
			function r({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card",
					className: (0, n.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-header",
					className: (0, n.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function i({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-title",
					className: (0, n.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-content",
					className: (0, n.cn)("px-4", e),
					...t,
				});
			}
		},
		81262: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("printer", [
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
		81672: (e, t, s) => {
			s.d(t, { Ge: () => m, N0: () => c, Yq: () => i, gQ: () => o, r6: () => d });
			let a = [
					"January",
					"February",
					"March",
					"April",
					"May",
					"June",
					"July",
					"August",
					"September",
					"October",
					"November",
					"December",
				],
				n = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
				r = (e) => String(e).padStart(2, "0");
			function l(e) {
				if (null == e || "" === e) return null;
				if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
				if ("number" == typeof e) {
					let t = new Date(e);
					return Number.isNaN(t.getTime()) ? null : t;
				}
				let t = String(e).trim();
				if (!t) return null;
				let s = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
				if (s) return new Date(Number(s[1]), Number(s[2]) - 1, Number(s[3]));
				let a = new Date(t.includes(" ") && !t.includes("T") ? t.replace(" ", "T") : t);
				return Number.isNaN(a.getTime()) ? null : a;
			}
			function i(e, t = "") {
				let s = l(e);
				return s ? `${r(s.getDate())}/${r(s.getMonth() + 1)}/${s.getFullYear()}` : t;
			}
			function d(e, t = "", s = !1) {
				let a = l(e);
				if (!a) return t;
				let n = `${r(a.getHours())}:${r(a.getMinutes())}${
					s ? `:${r(a.getSeconds())}` : ""
				}`;
				return `${i(a)} ${n}`;
			}
			function c(e, t = "") {
				let s = l(e);
				return s ? `${a[s.getMonth()]} ${s.getFullYear()}` : t;
			}
			function o(e, t = "") {
				let s = l(e);
				return s ? n[s.getDay()] : t;
			}
			function m(e, t = "") {
				let s = l(e);
				return s ? `${n[s.getDay()]}, ${i(s)}` : t;
			}
		},
		89123: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("chart-column", [
				["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
				["path", { d: "M18 17V9", key: "2bz60n" }],
				["path", { d: "M13 17V5", key: "1frdt8" }],
				["path", { d: "M8 17v-3", key: "17ska0" }],
			]);
		},
		91871: (e, t, s) => {
			s.r(t), s.d(t, { default: () => ed });
			var a = s(95155),
				n = s(81672),
				r = s(12115),
				l = s(55833),
				i = s(33745),
				d = s(56031),
				c = s(12180),
				o = s(66609),
				m = s(4474),
				u = s(79984),
				h = s(39658),
				x = s(38291),
				p = s(26518),
				j = s(83786),
				f = s(43447),
				g = s(84980),
				v = s(57420),
				b = s(12651),
				N = s(14636),
				y = s(62791),
				w = s(61878),
				k = s(92622),
				C = s(60285),
				A = s(38399);
			let _ = (0, s(90425).A)("message-circle", [
				[
					"path",
					{
						d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
						key: "1sd12s",
					},
				],
			]);
			var S = s(28063),
				M = s(13175),
				$ = s(85118),
				R = s(89123),
				z = s(66088),
				E = s(41585),
				P = s(20572),
				L = s(53483),
				D = s(31521),
				I = s(93408),
				F = s(99916),
				B = s(91337),
				T = s(70521),
				Q = s(74350),
				q = s(79792),
				O = s(6296);
			let V = [
				"Customer Not Reachable",
				"Customer Cancelled",
				"Vehicle Sold",
				"Wrong Contact Info",
				"Duplicate Booking",
				"Other",
			];
			function Z(e) {
				if (!e) return "";
				let t = new Date(e);
				if (Number.isNaN(t.getTime())) return "";
				let s = (e) => String(e).padStart(2, "0");
				return `${t.getFullYear()}-${s(t.getMonth() + 1)}-${s(t.getDate())}T${s(
					t.getHours()
				)}:${s(t.getMinutes())}`;
			}
			function J({ open: e, onOpenChange: t, onConfirm: s, loading: n }) {
				return (0, a.jsx)(T.Lt, {
					open: e,
					onOpenChange: t,
					children: (0, a.jsxs)(T.EO, {
						children: [
							(0, a.jsxs)(T.wd, {
								children: [
									(0, a.jsx)(T.r7, { children: "Confirm appointment?" }),
									(0, a.jsx)(T.$v, {
										children:
											"This submits the appointment and records customer confirmation. You can mark the vehicle as arrived after confirmation.",
									}),
								],
							}),
							(0, a.jsxs)(T.ck, {
								children: [
									(0, a.jsx)(T.Zr, { disabled: n, children: "Back" }),
									(0, a.jsx)(T.Rx, {
										onClick: s,
										disabled: n,
										children: n
											? (0, a.jsx)(O.A, {
													className: "h-4 w-4 animate-spin",
											  })
											: "Confirm",
									}),
								],
							}),
						],
					}),
				});
			}
			function W({
				open: e,
				onOpenChange: t,
				onSend: s,
				loading: n,
				customerName: r,
				phone: l,
			}) {
				return (0, a.jsx)(T.Lt, {
					open: e,
					onOpenChange: t,
					children: (0, a.jsxs)(T.EO, {
						children: [
							(0, a.jsxs)(T.wd, {
								children: [
									(0, a.jsx)(T.r7, { children: "Send WhatsApp reminder?" }),
									(0, a.jsxs)(T.$v, {
										children: [
											"Sends the appointment reminder template configured in WhatsApp Setup to",
											" ",
											r
												? (0, a.jsx)("strong", { children: r })
												: "the customer",
											l
												? (0, a.jsxs)(a.Fragment, {
														children: [
															" ",
															"at ",
															(0, a.jsx)("strong", { children: l }),
														],
												  })
												: null,
											". The appointment status will be updated to Reminder Sent.",
										],
									}),
								],
							}),
							(0, a.jsxs)(T.ck, {
								children: [
									(0, a.jsx)(T.Zr, { disabled: n, children: "Cancel" }),
									(0, a.jsx)(T.Rx, {
										onClick: s,
										disabled: n,
										children: n
											? (0, a.jsx)(O.A, {
													className: "h-4 w-4 animate-spin",
											  })
											: "Send reminder",
									}),
								],
							}),
						],
					}),
				});
			}
			function H({ open: e, onOpenChange: t, onCancel: s, loading: n }) {
				let [l, i] = (0, r.useState)(""),
					[d, c] = (0, r.useState)("");
				return (
					(0, r.useEffect)(() => {
						e || (i(""), c(""));
					}, [e]),
					(0, a.jsx)(Q.lG, {
						open: e,
						onOpenChange: t,
						children: (0, a.jsxs)(Q.Cf, {
							className: "sm:max-w-md",
							children: [
								(0, a.jsxs)(Q.c7, {
									children: [
										(0, a.jsx)(Q.L3, { children: "Cancel appointment" }),
										(0, a.jsx)(Q.rr, {
											children:
												"The appointment will be cancelled. Optionally record why the booking was cancelled.",
										}),
									],
								}),
								(0, a.jsxs)("div", {
									className: "space-y-4 py-2",
									children: [
										(0, a.jsxs)("div", {
											className: "space-y-1.5",
											children: [
												(0, a.jsx)(q.J, { children: "Reason" }),
												(0, a.jsxs)(p.l6, {
													value: l,
													onValueChange: i,
													children: [
														(0, a.jsx)(p.bq, {
															children: (0, a.jsx)(p.yv, {
																placeholder:
																	"Select reason (optional)",
															}),
														}),
														(0, a.jsx)(p.gC, {
															children: V.map((e) =>
																(0, a.jsx)(
																	p.eb,
																	{ value: e, children: e },
																	e
																)
															),
														}),
													],
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-1.5",
											children: [
												(0, a.jsx)(q.J, {
													htmlFor: "cancel-notes",
													children: "Notes",
												}),
												(0, a.jsx)(h.p, {
													id: "cancel-notes",
													value: d,
													onChange: (e) => c(e.target.value),
													placeholder: "Optional notes",
												}),
											],
										}),
									],
								}),
								(0, a.jsxs)(Q.Es, {
									children: [
										(0, a.jsx)(m.$, {
											type: "button",
											variant: "outline",
											onClick: () => t(!1),
											disabled: n,
											children: "Back",
										}),
										(0, a.jsx)(m.$, {
											type: "button",
											variant: "destructive",
											disabled: n,
											onClick: () =>
												s({
													reason: l || void 0,
													notes: d.trim() || void 0,
												}),
											children: n
												? (0, a.jsx)(O.A, {
														className: "h-4 w-4 animate-spin",
												  })
												: "Cancel appointment",
										}),
									],
								}),
							],
						}),
					})
				);
			}
			function G({
				open: e,
				onOpenChange: t,
				initialAppointmentDateTime: s,
				initialPromisedDateTime: n,
				onReschedule: l,
				loading: i,
			}) {
				let [d, c] = (0, r.useState)(""),
					[o, u] = (0, r.useState)("");
				return (
					(0, r.useEffect)(() => {
						e && (c(Z(s)), u(Z(n)));
					}, [e, s, n]),
					(0, a.jsx)(Q.lG, {
						open: e,
						onOpenChange: t,
						children: (0, a.jsxs)(Q.Cf, {
							className: "sm:max-w-md",
							children: [
								(0, a.jsxs)(Q.c7, {
									children: [
										(0, a.jsx)(Q.L3, { children: "Reschedule appointment" }),
										(0, a.jsx)(Q.rr, {
											children:
												"Choose a new date and time for this booking.",
										}),
									],
								}),
								(0, a.jsxs)("div", {
									className: "space-y-4 py-2",
									children: [
										(0, a.jsxs)("div", {
											className: "space-y-1.5",
											children: [
												(0, a.jsx)(q.J, {
													htmlFor: "reschedule-at",
													children: "New appointment date & time",
												}),
												(0, a.jsx)(h.p, {
													id: "reschedule-at",
													type: "datetime-local",
													value: d,
													onChange: (e) => c(e.target.value),
													required: !0,
												}),
											],
										}),
										(0, a.jsxs)("div", {
											className: "space-y-1.5",
											children: [
												(0, a.jsx)(q.J, {
													htmlFor: "reschedule-promised",
													children: "Promised delivery (optional)",
												}),
												(0, a.jsx)(h.p, {
													id: "reschedule-promised",
													type: "datetime-local",
													value: o,
													onChange: (e) => u(e.target.value),
												}),
											],
										}),
									],
								}),
								(0, a.jsxs)(Q.Es, {
									children: [
										(0, a.jsx)(m.$, {
											type: "button",
											variant: "outline",
											onClick: () => t(!1),
											disabled: i,
											children: "Back",
										}),
										(0, a.jsx)(m.$, {
											type: "button",
											disabled: i || !d,
											onClick: () =>
												l({
													appointment_date_time: d,
													promised_delivery_date_time: o || void 0,
												}),
											children: i
												? (0, a.jsx)(O.A, {
														className: "h-4 w-4 animate-spin",
												  })
												: "Reschedule",
										}),
									],
								}),
							],
						}),
					})
				);
			}
			var U = s(36020),
				Y = s(98883),
				X = s(65855),
				K = s(20953);
			function ee(e) {
				return 0 === (0, K.mC)(e.docstatus) && !K.CM.has(e.status) && !K.Ze.has(e.status);
			}
			function et(e) {
				return 0 === (0, K.mC)(e.docstatus) && ("Draft" === e.status || !e.status);
			}
			function es(e) {
				return (
					1 === (0, K.mC)(e.docstatus) &&
					[
						"Requested",
						"Scheduled",
						"Confirmed",
						"Booked",
						"Reminder Sent",
						"Rescheduled",
					].includes(e.status)
				);
			}
			function ea(e) {
				return e.docstatus < 2 && !K.CM.has(e.status) && !K.Ze.has(e.status);
			}
			function en(e) {
				return 2 > (0, K.mC)(e.docstatus) && "Completed" !== e.status;
			}
			function er(e) {
				let t = {
					Draft: {
						color: "bg-muted text-muted-foreground border-muted-foreground/20",
						icon: g.A,
					},
					Requested: {
						color: "bg-sky-500/10 text-sky-800 border-sky-500/20",
						icon: v.A,
					},
					Scheduled: {
						color: "bg-chart-1/10 text-chart-1 border-chart-1/20",
						icon: v.A,
					},
					Confirmed: {
						color: "bg-emerald-500/10 text-emerald-800 border-emerald-500/20",
						icon: b.A,
					},
					Booked: { color: "bg-chart-1/10 text-chart-1 border-chart-1/20", icon: v.A },
					"Reminder Sent": {
						color: "bg-chart-4/10 text-chart-4 border-chart-4/20",
						icon: g.A,
					},
					Arrived: { color: "bg-chart-3/10 text-chart-3 border-chart-3/20", icon: b.A },
					"In Inspection": {
						color: "bg-primary/10 text-primary border-primary/20",
						icon: N.A,
					},
					"In Workshop": {
						color: "bg-primary/10 text-primary border-primary/20",
						icon: N.A,
					},
					"Ready for Pickup": {
						color: "bg-chart-3/10 text-chart-3 border-chart-3/20",
						icon: b.A,
					},
					Completed: {
						color: "bg-chart-3/10 text-chart-3 border-chart-3/20",
						icon: b.A,
					},
					"No-Show": {
						color: "bg-destructive/10 text-destructive border-destructive/20",
						icon: y.A,
					},
					Cancelled: {
						color: "bg-destructive/10 text-destructive border-destructive/20",
						icon: y.A,
					},
					Rescheduled: {
						color: "bg-chart-4/10 text-chart-4 border-chart-4/20",
						icon: g.A,
					},
				};
				return t[e || "Booked"] || t.Booked;
			}
			function el(e) {
				if (!e) return { date: "—", time: "" };
				let t = new Date(e);
				return Number.isNaN(t.getTime())
					? { date: e, time: "" }
					: { date: (0, d.GP)(t, "MMM d, yyyy"), time: (0, d.GP)(t, "h:mm a") };
			}
			function ei(e) {
				let t = {
					Normal: { color: "bg-muted text-muted-foreground", label: "Normal" },
					VIP: { color: "bg-chart-4/10 text-chart-4 border-chart-4/20", label: "VIP" },
					Urgent: {
						color: "bg-destructive/10 text-destructive border-destructive/20",
						label: "Urgent",
					},
					"Comeback/Repeat Repair": {
						color: "bg-destructive/10 text-destructive border-destructive/20",
						label: "Comeback",
					},
					"Safety Critical": {
						color: "bg-destructive/10 text-destructive border-destructive/20",
						label: "Safety",
					},
					Immobilized: {
						color: "bg-destructive/10 text-destructive border-destructive/20",
						label: "Immobilized",
					},
					"Fleet Priority": {
						color: "bg-chart-1/10 text-chart-1 border-chart-1/20",
						label: "Fleet",
					},
					Emergency: {
						color: "bg-destructive/10 text-destructive border-destructive/20",
						label: "Emergency",
					},
				};
				return t[e] || t.Normal;
			}
			function ed() {
				let { navigate: e, viewParams: t } = (0, l.c)(),
					[s, y] = (0, D.P)("appointments", "search", ""),
					[T, Q] = (0, D.P)("appointments", "status", "all"),
					[q, O] = (0, D.P)("appointments", "priority", "all"),
					[V, Z] = (0, D.P)("appointments", "date", ""),
					[ed, ec] = (0, r.useState)(1),
					[eo, em] = (0, r.useState)(50),
					[eu, eh] = (0, r.useState)(null),
					[ex, ep] = (0, r.useState)(null),
					[ej, ef] = (0, r.useState)(!1),
					[eg, ev] = (0, r.useState)(!1),
					[eb, eN] = (0, r.useState)(!1),
					[ey, ew] = (0, r.useState)(!1),
					[ek, eC] = (0, r.useState)(!1),
					[eA, e_] = (0, r.useState)(!1),
					{ data: eS, isLoading: eM } = (0, U.zV)(eu),
					e$ = (0, r.useCallback)(async () => {
						await (0, c.j)((e) => Array.isArray(e) && "appointments" === e[0]),
							eu && (await (0, c.j)(["appointment", eu]));
					}, [eu]);
				(0, r.useEffect)(() => {
					let e = t.get("date");
					e && Z(e);
				}, [t]);
				let eR = {
						status: "all" !== T ? T : void 0,
						date: V || void 0,
						search: s || void 0,
					},
					{
						data: ez,
						isLoading: eE,
						error: eP,
					} = (0, U.QC)({ ...eR, limit: eo, offset: (ed - 1) * eo }),
					eL = ez?.total || 0,
					eD = [T, q, s, V, ed, eo].join("|"),
					{
						items: eI,
						loadedCount: eF,
						isLoadingMore: eB,
						loadMore: eT,
					} = (0, L.h)({
						items: ez?.data,
						total: eL,
						offset: (ed - 1) * eo,
						resetKey: eD,
						enabled: eo >= L.J,
						fetchMore: async (e, t) =>
							(await X.N5({ ...eR, limit: t, offset: e })).data,
					});
				(0, r.useEffect)(() => {
					ec(1);
				}, [T, q, s, V]);
				let eQ = (eI || []).filter((e) => {
						let t =
								"" === s ||
								e.customer_name?.toLowerCase().includes(s.toLowerCase()) ||
								e.name?.toLowerCase().includes(s.toLowerCase()) ||
								e.vehicle?.toLowerCase().includes(s.toLowerCase()) ||
								e.vehicle_model?.toLowerCase().includes(s.toLowerCase()) ||
								e.vin_chassis?.toLowerCase().includes(s.toLowerCase()) ||
								e.vin_number?.toLowerCase().includes(s.toLowerCase()) ||
								e.license_plate?.toLowerCase().includes(s.toLowerCase()),
							a = "all" === q || e.priority === q;
						return t && a;
					}),
					eq = (eI || []).filter((e) => {
						if (!e.appointment_date_time) return !1;
						let t = new Date(e.appointment_date_time);
						return (
							!Number.isNaN(t.getTime()) &&
							(0, d.GP)(t, "yyyy-MM-dd") === (0, d.GP)(new Date(), "yyyy-MM-dd")
						);
					}).length,
					eO = (eI || []).filter((e) => K.Ze.has(e.status)).length,
					eV = (eI || []).filter(
						(e) =>
							0 === (0, K.mC)(e.docstatus) &&
							("Draft" === e.status ||
								"Requested" === e.status ||
								"Scheduled" === e.status ||
								"Confirmed" === e.status ||
								"Booked" === e.status)
					).length,
					eZ = async () => {
						if (ex) {
							eC(!0);
							try {
								await X.qk(ex.name),
									o.o.success("Appointment confirmed"),
									ef(!1),
									await e$();
							} catch (e) {
								o.o.error(
									e instanceof Error
										? e.message
										: "Failed to confirm appointment"
								);
							} finally {
								eC(!1);
							}
						}
					},
					eJ = async (e) => {
						eC(!0);
						try {
							await X.tC(e.name), o.o.success("Marked as arrived"), await e$();
						} catch (e) {
							o.o.error(
								e instanceof Error ? e.message : "Failed to mark as arrived"
							);
						} finally {
							eC(!1);
						}
					},
					eW = async (e) => {
						if (ex) {
							eC(!0);
							try {
								await X.ol(ex.name, e),
									o.o.success("Appointment cancelled"),
									ev(!1),
									await e$();
							} catch (e) {
								o.o.error(
									e instanceof Error ? e.message : "Failed to cancel appointment"
								);
							} finally {
								eC(!1);
							}
						}
					},
					eH = async (e) => {
						if (ex) {
							eC(!0);
							try {
								await X.qX(ex.name, e),
									o.o.success("Appointment rescheduled"),
									eN(!1),
									await e$();
							} catch (e) {
								o.o.error(
									e instanceof Error
										? e.message
										: "Failed to reschedule appointment"
								);
							} finally {
								eC(!1);
							}
						}
					},
					eG = async () => {
						if (ex) {
							eC(!0);
							try {
								await X.YU(ex.name),
									o.o.success("WhatsApp reminder sent"),
									ew(!1),
									await e$();
							} catch (e) {
								o.o.error(
									e instanceof Error ? e.message : "Failed to send reminder"
								);
							} finally {
								eC(!1);
							}
						}
					};
				return (0, a.jsxs)("div", {
					className: "flex min-w-0 flex-col gap-4 sm:gap-6",
					children: [
						(0, a.jsxs)(u.Zp, {
							className: "order-1 md:order-2",
							children: [
								(0, a.jsxs)(u.aR, {
									className:
										"flex items-center justify-between gap-3 sm:items-start",
									children: [
										(0, a.jsxs)("div", {
											className: "min-w-0",
											children: [
												(0, a.jsx)(u.ZB, {
													className: "hidden md:block",
													children: "Service Appointments",
												}),
												!eE && eL > 0
													? (0, a.jsx)("p", {
															className:
																"mt-1 text-sm text-muted-foreground md:hidden",
															children:
																eQ.length === eL
																	? `${eL} appointment${
																			1 === eL ? "" : "s"
																	  }`
																	: `${eQ.length} of ${eL} shown`,
													  })
													: null,
											],
										}),
										(0, a.jsx)(i.l, {
											module: "appointments",
											label: "New Appointment",
											onClick: () => e("appointment-new"),
										}),
									],
								}),
								(0, a.jsxs)(u.Wu, {
									className: "min-w-0",
									children: [
										V &&
											(0, a.jsxs)("div", {
												className:
													"mb-4 flex flex-wrap items-center gap-2",
												children: [
													(0, a.jsxs)(x.E, {
														variant: "outline",
														children: [
															"Date: ",
															(0, d.GP)(
																new Date(`${V}T12:00:00`),
																"MMM d, yyyy"
															),
														],
													}),
													(0, a.jsx)(F.r, {
														label: "Clear date",
														onClear: () => {
															Z(""), e("appointments");
														},
													}),
												],
											}),
										(0, a.jsxs)("div", {
											className:
												"mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row",
											children: [
												(0, a.jsxs)("div", {
													className: "relative flex-1",
													children: [
														(0, a.jsx)(w.A, {
															className:
																"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
														}),
														(0, a.jsx)(h.p, {
															placeholder:
																"Search by customer, ID, vehicle, or plate...",
															value: s,
															onChange: (e) => y(e.target.value),
															className: "pl-9",
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className:
														"flex flex-col gap-2 sm:flex-row sm:gap-2",
													children: [
														(0, a.jsx)(h.p, {
															type: "date",
															value: V,
															onChange: (e) => Z(e.target.value),
															className: "w-full sm:w-40",
															"aria-label": "Filter by date",
														}),
														(0, a.jsxs)(p.l6, {
															value: T,
															onValueChange: Q,
															children: [
																(0, a.jsxs)(p.bq, {
																	className: "w-full sm:w-40",
																	children: [
																		(0, a.jsx)(k.A, {
																			className:
																				"mr-2 h-4 w-4",
																		}),
																		(0, a.jsx)(p.yv, {
																			placeholder: "Status",
																		}),
																	],
																}),
																(0, a.jsxs)(p.gC, {
																	children: [
																		(0, a.jsx)(p.eb, {
																			value: "all",
																			children: "All Status",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Draft",
																			children: "Draft",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Requested",
																			children: "Requested",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Scheduled",
																			children: "Scheduled",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Confirmed",
																			children: "Confirmed",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Booked",
																			children: "Booked",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Reminder Sent",
																			children:
																				"Reminder Sent",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Arrived",
																			children: "Arrived",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "In Inspection",
																			children:
																				"In Inspection",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "In Workshop",
																			children:
																				"In Workshop",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Ready for Pickup",
																			children:
																				"Ready for Pickup",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Completed",
																			children: "Completed",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Rescheduled",
																			children:
																				"Rescheduled",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Cancelled",
																			children: "Cancelled",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "No-Show",
																			children: "No-Show",
																		}),
																	],
																}),
															],
														}),
														(0, a.jsxs)(p.l6, {
															value: q,
															onValueChange: O,
															children: [
																(0, a.jsx)(p.bq, {
																	className: "w-full sm:w-36",
																	children: (0, a.jsx)(p.yv, {
																		placeholder: "Priority",
																	}),
																}),
																(0, a.jsxs)(p.gC, {
																	children: [
																		(0, a.jsx)(p.eb, {
																			value: "all",
																			children:
																				"All Priority",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Normal",
																			children: "Normal",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "VIP",
																			children: "VIP",
																		}),
																		(0, a.jsx)(p.eb, {
																			value: "Urgent",
																			children: "Urgent",
																		}),
																	],
																}),
															],
														}),
													],
												}),
											],
										}),
										(0, a.jsx)("div", {
											className: "space-y-3 md:hidden",
											children: eE
												? (0, a.jsx)("p", {
														className:
															"py-8 text-center text-sm text-muted-foreground",
														children: "Loading…",
												  })
												: 0 === eQ.length
												? (0, a.jsxs)("div", {
														className:
															"rounded-lg border border-dashed py-10 text-center",
														children: [
															(0, a.jsx)(v.A, {
																className:
																	"mx-auto h-10 w-10 text-muted-foreground/40",
															}),
															(0, a.jsx)("p", {
																className:
																	"mt-3 text-sm font-medium",
																children: "No appointments found",
															}),
															(0, a.jsx)("p", {
																className:
																	"mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																children:
																	"Try adjusting search or filters, or create a new appointment",
															}),
														],
												  })
												: (0, a.jsxs)(a.Fragment, {
														children: [
															(0, a.jsx)("p", {
																className:
																	"text-xs font-medium uppercase tracking-wide text-muted-foreground",
																children: "Tap a row for details",
															}),
															eQ.map((t) => {
																let s = er(t.status),
																	n = ei(t.priority),
																	r = s.icon,
																	{ date: l, time: i } = el(
																		t.appointment_date_time
																	),
																	d = (
																		t.service_type_requested ||
																		[]
																	)
																		.map((e) => e.service_type)
																		.filter(Boolean)
																		.join(", "),
																	c = (0, B.w)({
																		vin:
																			t.vin_number ||
																			t.vin_chassis,
																		model:
																			t.vehicle_model ||
																			t.vehicle,
																		license: t.license_plate,
																	});
																return (0, a.jsx)(
																	"div",
																	{
																		className:
																			"rounded-lg border border-border bg-card p-4",
																		children: (0, a.jsxs)(
																			"div",
																			{
																				className:
																					"flex items-start gap-2",
																				children: [
																					(0, a.jsxs)(
																						"button",
																						{
																							type: "button",
																							onClick:
																								() =>
																									eh(
																										t.name
																									),
																							className:
																								"min-w-0 flex-1 text-left transition-colors hover:opacity-80",
																							children:
																								[
																									(0,
																									a.jsx)(
																										"p",
																										{
																											className:
																												"font-medium",
																											children:
																												t.customer_name,
																										}
																									),
																									(0,
																									a.jsx)(
																										"p",
																										{
																											className:
																												"truncate text-sm text-muted-foreground",
																											children:
																												t.name,
																										}
																									),
																									(0,
																									a.jsxs)(
																										"div",
																										{
																											className:
																												"mt-2 space-y-1 text-sm text-muted-foreground",
																											children:
																												[
																													(0,
																													a.jsx)(
																														"p",
																														{
																															className:
																																"font-medium text-foreground",
																															children:
																																c.primary,
																														}
																													),
																													c.secondary
																														? (0,
																														  a.jsx)(
																																"p",
																																{
																																	children:
																																		c.secondary,
																																}
																														  )
																														: null,
																													(0,
																													a.jsxs)(
																														"p",
																														{
																															children:
																																[
																																	l,
																																	i
																																		? ` \xb7 ${i}`
																																		: "",
																																],
																														}
																													),
																													d
																														? (0,
																														  a.jsx)(
																																"p",
																																{
																																	className:
																																		"truncate",
																																	children:
																																		d,
																																}
																														  )
																														: null,
																												],
																										}
																									),
																									(0,
																									a.jsx)(
																										x.E,
																										{
																											variant:
																												"outline",
																											className: `mt-2 ${n.color}`,
																											children:
																												n.label,
																										}
																									),
																								],
																						}
																					),
																					(0, a.jsxs)(
																						"div",
																						{
																							className:
																								"flex shrink-0 flex-col items-end gap-2 self-stretch",
																							children:
																								[
																									(0,
																									a.jsxs)(
																										x.E,
																										{
																											variant:
																												"outline",
																											className: `max-w-38 justify-end text-[11px] leading-tight ${s.color}`,
																											children:
																												[
																													(0,
																													a.jsx)(
																														r,
																														{
																															className:
																																"mr-1 h-3 w-3 shrink-0",
																														}
																													),
																													(0,
																													a.jsx)(
																														"span",
																														{
																															className:
																																"truncate",
																															children:
																																t.status,
																														}
																													),
																												],
																										}
																									),
																									(0,
																									a.jsx)(
																										"div",
																										{
																											className:
																												"mt-auto",
																											children:
																												(0,
																												a.jsx)(
																													I.m,
																													{
																														doctype:
																															"Service Appointment",
																														docName:
																															t.name,
																														children:
																															(0,
																															a.jsxs)(
																																f.rI,
																																{
																																	children:
																																		[
																																			(0,
																																			a.jsx)(
																																				f.ty,
																																				{
																																					asChild:
																																						!0,
																																					children:
																																						(0,
																																						a.jsx)(
																																							m.$,
																																							{
																																								variant:
																																									"ghost",
																																								size: "icon",
																																								className:
																																									"shrink-0",
																																								children:
																																									(0,
																																									a.jsx)(
																																										C.A,
																																										{
																																											className:
																																												"h-4 w-4",
																																										}
																																									),
																																							}
																																						),
																																				}
																																			),
																																			(0,
																																			a.jsxs)(
																																				f.SQ,
																																				{
																																					align: "end",
																																					children:
																																						[
																																							et(
																																								t
																																							)
																																								? (0,
																																								  a.jsxs)(
																																										f._2,
																																										{
																																											onClick:
																																												() =>
																																													e(
																																														"appointment-new",
																																														{
																																															id: t.name,
																																														}
																																													),
																																											children:
																																												[
																																													(0,
																																													a.jsx)(
																																														A.A,
																																														{
																																															className:
																																																"h-4 w-4 mr-2",
																																														}
																																													),
																																													"Continue Editing",
																																												],
																																										}
																																								  )
																																								: (0,
																																								  a.jsx)(
																																										f._2,
																																										{
																																											onClick:
																																												() =>
																																													e(
																																														"appointment-new",
																																														{
																																															id: t.name,
																																														}
																																													),
																																											children:
																																												"Edit",
																																										}
																																								  ),
																																							(0,
																																							a.jsx)(
																																								f.mB,
																																								{}
																																							),
																																							ee(
																																								t
																																							) &&
																																								(0,
																																								a.jsxs)(
																																									f._2,
																																									{
																																										onClick:
																																											() => {
																																												ep(
																																													t
																																												),
																																													ef(
																																														!0
																																													);
																																											},
																																										children:
																																											[
																																												(0,
																																												a.jsx)(
																																													b.A,
																																													{
																																														className:
																																															"h-4 w-4 mr-2",
																																													}
																																												),
																																												"Confirm appointment",
																																											],
																																									}
																																								),
																																							(0,
																																							K.FA)(
																																								t
																																							) &&
																																								(0,
																																								a.jsxs)(
																																									f._2,
																																									{
																																										disabled:
																																											!!(0,
																																											K.ih)(
																																												t
																																											) ||
																																											ek,
																																										title:
																																											(0,
																																											K.ih)(
																																												t
																																											) ||
																																											void 0,
																																										onClick:
																																											() => {
																																												(0,
																																												K.ih)(
																																													t
																																												) ||
																																													(ep(
																																														t
																																													),
																																													ew(
																																														!0
																																													));
																																											},
																																										children:
																																											[
																																												(0,
																																												a.jsx)(
																																													_,
																																													{
																																														className:
																																															"h-4 w-4 mr-2",
																																													}
																																												),
																																												"Send reminder",
																																											],
																																									}
																																								),
																																							es(
																																								t
																																							) &&
																																								(0,
																																								a.jsxs)(
																																									f._2,
																																									{
																																										disabled:
																																											ek,
																																										onClick:
																																											() =>
																																												void eJ(
																																													t
																																												),
																																										children:
																																											[
																																												(0,
																																												a.jsx)(
																																													N.A,
																																													{
																																														className:
																																															"h-4 w-4 mr-2",
																																													}
																																												),
																																												"Mark as arrived",
																																											],
																																									}
																																								),
																																							"Arrived" ===
																																								t.status &&
																																								(0,
																																								a.jsxs)(
																																									f._2,
																																									{
																																										onClick:
																																											() =>
																																												e(
																																													"inspection-new",
																																													{
																																														appointment:
																																															t.name,
																																													}
																																												),
																																										children:
																																											[
																																												(0,
																																												a.jsx)(
																																													N.A,
																																													{
																																														className:
																																															"h-4 w-4 mr-2",
																																													}
																																												),
																																												"Start inspection",
																																											],
																																									}
																																								),
																																							ea(
																																								t
																																							) &&
																																								(0,
																																								a.jsxs)(
																																									f._2,
																																									{
																																										onClick:
																																											() => {
																																												ep(
																																													t
																																												),
																																													eN(
																																														!0
																																													);
																																											},
																																										children:
																																											[
																																												(0,
																																												a.jsx)(
																																													S.A,
																																													{
																																														className:
																																															"h-4 w-4 mr-2",
																																													}
																																												),
																																												"Reschedule",
																																											],
																																									}
																																								),
																																							en(
																																								t
																																							) &&
																																								(0,
																																								a.jsxs)(
																																									a.Fragment,
																																									{
																																										children:
																																											[
																																												(0,
																																												a.jsx)(
																																													f.mB,
																																													{}
																																												),
																																												(0,
																																												a.jsxs)(
																																													f._2,
																																													{
																																														className:
																																															"text-destructive",
																																														onClick:
																																															() => {
																																																ep(
																																																	t
																																																),
																																																	ev(
																																																		!0
																																																	);
																																															},
																																														children:
																																															[
																																																(0,
																																																a.jsx)(
																																																	M.A,
																																																	{
																																																		className:
																																																			"h-4 w-4 mr-2",
																																																	}
																																																),
																																																"Cancel appointment",
																																															],
																																													}
																																												),
																																											],
																																									}
																																								),
																																						],
																																				}
																																			),
																																		],
																																}
																															),
																													}
																												),
																										}
																									),
																								],
																						}
																					),
																				],
																			}
																		),
																	},
																	t.name
																);
															}),
														],
												  }),
										}),
										eQ.length > 0
											? (0, a.jsx)("div", {
													className: "mt-4 md:hidden",
													children: (0, a.jsx)(P.$, {
														page: ed,
														pageSize: eo,
														totalItems: eL,
														loadedCount: eF,
														onPageChange: ec,
														onPageSizeChange: em,
														onLoadMore: eT,
														isLoadingMore: eB,
													}),
											  })
											: null,
										(0, a.jsx)("div", {
											className:
												"dms-table-panel hidden md:block rounded-lg border",
											children: (0, a.jsxs)(j.XI, {
												children: [
													(0, a.jsx)(j.A0, {
														children: (0, a.jsxs)(j.Hj, {
															children: [
																(0, a.jsx)(j.nd, {
																	children: "Appointment",
																}),
																(0, a.jsx)(j.nd, {
																	children: "Customer",
																}),
																(0, a.jsx)(j.nd, {
																	children: "Vehicle",
																}),
																(0, a.jsx)(j.nd, {
																	children: "Service",
																}),
																(0, a.jsx)(j.nd, {
																	children: "Time",
																}),
																(0, a.jsx)(j.nd, {
																	children: "Status",
																}),
																(0, a.jsx)(j.nd, {
																	className: "w-12",
																}),
															],
														}),
													}),
													(0, a.jsx)(j.BF, {
														children: eQ.map((t) => {
															let s = er(t.status),
																n = ei(t.priority),
																r = s.icon,
																{ date: l, time: i } = el(
																	t.appointment_date_time
																),
																d = (
																	t.service_type_requested || []
																)
																	.map((e) => e.service_type)
																	.filter(Boolean)
																	.join(", "),
																c = (0, B.w)({
																	vin:
																		t.vin_number ||
																		t.vin_chassis,
																	model:
																		t.vehicle_model ||
																		t.vehicle,
																	license: t.license_plate,
																});
															return (0, a.jsxs)(
																j.Hj,
																{
																	children: [
																		(0, a.jsx)(j.nA, {
																			children: (0, a.jsxs)(
																				"div",
																				{
																					className:
																						"flex items-center gap-3",
																					children: [
																						(0, a.jsx)(
																							"div",
																							{
																								className:
																									"flex h-10 w-10 items-center justify-center rounded-full bg-primary/10",
																								children:
																									(0,
																									a.jsx)(
																										v.A,
																										{
																											className:
																												"h-3.5 w-3.5 text-primary",
																										}
																									),
																							}
																						),
																						(0,
																						a.jsxs)(
																							"div",
																							{
																								children:
																									[
																										(0,
																										a.jsx)(
																											"a",
																											{
																												href: "#",
																												onClick:
																													(
																														e
																													) => {
																														e.preventDefault(),
																															eh(
																																t.name
																															);
																													},
																												className:
																													"font-medium hover:text-primary",
																												children:
																													t.name,
																											}
																										),
																										(0,
																										a.jsxs)(
																											"div",
																											{
																												className:
																													"flex items-center gap-2",
																												children:
																													[
																														(0,
																														a.jsx)(
																															x.E,
																															{
																																variant:
																																	"outline",
																																className:
																																	n.color,
																																children:
																																	n.label,
																															}
																														),
																														(0,
																														a.jsx)(
																															"span",
																															{
																																className:
																																	"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																																children:
																																	t.booking_source,
																															}
																														),
																													],
																											}
																										),
																									],
																							}
																						),
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(j.nA, {
																			children: (0, a.jsxs)(
																				"div",
																				{
																					children: [
																						(0, a.jsx)(
																							"p",
																							{
																								className:
																									"font-medium",
																								children:
																									t.customer_name,
																							}
																						),
																						(0, a.jsx)(
																							"div",
																							{
																								className:
																									"flex items-center gap-3 text-sm text-muted-foreground",
																								children:
																									(0,
																									a.jsxs)(
																										"span",
																										{
																											className:
																												"flex items-center gap-1",
																											children:
																												[
																													(0,
																													a.jsx)(
																														$.A,
																														{
																															className:
																																"h-3 w-3",
																														}
																													),
																													(0,
																													K.ms)(
																														t
																													) ||
																														"—",
																												],
																										}
																									),
																							}
																						),
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(j.nA, {
																			children: (0, a.jsxs)(
																				"div",
																				{
																					children: [
																						(0, a.jsx)(
																							"p",
																							{
																								className:
																									"font-medium",
																								children:
																									c.primary,
																							}
																						),
																						c.secondary
																							? (0,
																							  a.jsx)(
																									"p",
																									{
																										className:
																											"text-sm text-muted-foreground",
																										children:
																											c.secondary,
																									}
																							  )
																							: null,
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(j.nA, {
																			children: (0, a.jsxs)(
																				"div",
																				{
																					className:
																						"max-w-48",
																					children: [
																						(0, a.jsx)(
																							"p",
																							{
																								className:
																									"truncate text-sm",
																								children:
																									d ||
																									"—",
																							}
																						),
																						(0, a.jsx)(
																							"p",
																							{
																								className:
																									"truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																								children:
																									t.customer_complaint_summary,
																							}
																						),
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(j.nA, {
																			children: (0, a.jsxs)(
																				"div",
																				{
																					className:
																						"text-sm",
																					children: [
																						(0, a.jsx)(
																							"p",
																							{
																								className:
																									"font-medium",
																								children:
																									l,
																							}
																						),
																						i
																							? (0,
																							  a.jsx)(
																									"p",
																									{
																										className:
																											"text-muted-foreground",
																										children:
																											i,
																									}
																							  )
																							: null,
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(j.nA, {
																			children: (0, a.jsxs)(
																				x.E,
																				{
																					variant:
																						"outline",
																					className:
																						s.color,
																					children: [
																						(0, a.jsx)(
																							r,
																							{
																								className:
																									"mr-1 h-3 w-3",
																							}
																						),
																						t.status,
																					],
																				}
																			),
																		}),
																		(0, a.jsx)(j.nA, {
																			children: (0, a.jsx)(
																				I.m,
																				{
																					doctype:
																						"Service Appointment",
																					docName:
																						t.name,
																					children: (0,
																					a.jsxs)(f.rI, {
																						children: [
																							(0,
																							a.jsx)(
																								f.ty,
																								{
																									asChild:
																										!0,
																									children:
																										(0,
																										a.jsx)(
																											m.$,
																											{
																												variant:
																													"ghost",
																												size: "icon",
																												children:
																													(0,
																													a.jsx)(
																														C.A,
																														{
																															className:
																																"h-4 w-4",
																														}
																													),
																											}
																										),
																								}
																							),
																							(0,
																							a.jsxs)(
																								f.SQ,
																								{
																									align: "end",
																									children:
																										[
																											et(
																												t
																											)
																												? (0,
																												  a.jsxs)(
																														f._2,
																														{
																															onClick:
																																() =>
																																	e(
																																		"appointment-new",
																																		{
																																			id: t.name,
																																		}
																																	),
																															children:
																																[
																																	(0,
																																	a.jsx)(
																																		A.A,
																																		{
																																			className:
																																				"h-4 w-4 mr-2",
																																		}
																																	),
																																	"Continue Editing",
																																],
																														}
																												  )
																												: (0,
																												  a.jsx)(
																														f._2,
																														{
																															onClick:
																																() =>
																																	e(
																																		"appointment-new",
																																		{
																																			id: t.name,
																																		}
																																	),
																															children:
																																"Edit",
																														}
																												  ),
																											(0,
																											a.jsx)(
																												f.mB,
																												{}
																											),
																											ee(
																												t
																											) &&
																												(0,
																												a.jsxs)(
																													f._2,
																													{
																														className:
																															"text-primary",
																														onClick:
																															() => {
																																ep(
																																	t
																																),
																																	ef(
																																		!0
																																	);
																															},
																														children:
																															[
																																(0,
																																a.jsx)(
																																	b.A,
																																	{
																																		className:
																																			"h-4 w-4 mr-2",
																																	}
																																),
																																"Confirm appointment",
																															],
																													}
																												),
																											(0,
																											K.FA)(
																												t
																											) &&
																												(0,
																												a.jsxs)(
																													f._2,
																													{
																														disabled:
																															!!(0,
																															K.ih)(
																																t
																															) ||
																															ek,
																														title:
																															(0,
																															K.ih)(
																																t
																															) ||
																															void 0,
																														onClick:
																															() => {
																																(0,
																																K.ih)(
																																	t
																																) ||
																																	(ep(
																																		t
																																	),
																																	ew(
																																		!0
																																	));
																															},
																														children:
																															[
																																(0,
																																a.jsx)(
																																	_,
																																	{
																																		className:
																																			"h-4 w-4 mr-2",
																																	}
																																),
																																"Send reminder",
																																(0,
																																K.ih)(
																																	t
																																)
																																	? (0,
																																	  a.jsxs)(
																																			"span",
																																			{
																																				className:
																																					"ml-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																																				children:
																																					[
																																						"(",
																																						(0,
																																						K.ih)(
																																							t
																																						),
																																						")",
																																					],
																																			}
																																	  )
																																	: null,
																															],
																													}
																												),
																											es(
																												t
																											) &&
																												(0,
																												a.jsxs)(
																													f._2,
																													{
																														className:
																															"text-chart-3",
																														disabled:
																															ek,
																														onClick:
																															() =>
																																void eJ(
																																	t
																																),
																														children:
																															[
																																(0,
																																a.jsx)(
																																	N.A,
																																	{
																																		className:
																																			"h-4 w-4 mr-2",
																																	}
																																),
																																"Mark as arrived",
																															],
																													}
																												),
																											"Arrived" ===
																												t.status &&
																												(0,
																												a.jsxs)(
																													f._2,
																													{
																														className:
																															"text-primary",
																														onClick:
																															() =>
																																e(
																																	"inspection-new",
																																	{
																																		appointment:
																																			t.name,
																																	}
																																),
																														children:
																															[
																																(0,
																																a.jsx)(
																																	N.A,
																																	{
																																		className:
																																			"h-4 w-4 mr-2",
																																	}
																																),
																																"Start inspection",
																															],
																													}
																												),
																											ea(
																												t
																											) &&
																												(0,
																												a.jsxs)(
																													f._2,
																													{
																														onClick:
																															() => {
																																ep(
																																	t
																																),
																																	eN(
																																		!0
																																	);
																															},
																														children:
																															[
																																(0,
																																a.jsx)(
																																	S.A,
																																	{
																																		className:
																																			"h-4 w-4 mr-2",
																																	}
																																),
																																"Reschedule",
																															],
																													}
																												),
																											en(
																												t
																											) &&
																												(0,
																												a.jsxs)(
																													a.Fragment,
																													{
																														children:
																															[
																																(0,
																																a.jsx)(
																																	f.mB,
																																	{}
																																),
																																(0,
																																a.jsxs)(
																																	f._2,
																																	{
																																		className:
																																			"text-destructive",
																																		onClick:
																																			() => {
																																				ep(
																																					t
																																				),
																																					ev(
																																						!0
																																					);
																																			},
																																		children:
																																			[
																																				(0,
																																				a.jsx)(
																																					M.A,
																																					{
																																						className:
																																							"h-4 w-4 mr-2",
																																					}
																																				),
																																				"Cancel appointment",
																																			],
																																	}
																																),
																															],
																													}
																												),
																										],
																								}
																							),
																						],
																					}),
																				}
																			),
																		}),
																	],
																},
																t.name
															);
														}),
													}),
												],
											}),
										}),
										0 === eQ.length &&
											!eE &&
											(0, a.jsxs)("div", {
												className: "hidden py-12 text-center md:block",
												children: [
													(0, a.jsx)(v.A, {
														className:
															"mx-auto h-12 w-12 text-muted-foreground/50",
													}),
													(0, a.jsx)("p", {
														className: "mt-4 text-lg font-medium",
														children: "No appointments found",
													}),
													(0, a.jsx)("p", {
														className: "text-sm text-muted-foreground",
														children:
															"Try adjusting your search or filter criteria",
													}),
												],
											}),
										(0, a.jsx)("div", {
											className: "hidden md:block",
											children: (0, a.jsx)(P.$, {
												page: ed,
												pageSize: eo,
												totalItems: eL,
												loadedCount: eF,
												onPageChange: ec,
												onPageSizeChange: em,
												onLoadMore: eT,
												isLoadingMore: eB,
											}),
										}),
									],
								}),
							],
						}),
						(0, a.jsxs)("div", {
							className: "order-2 space-y-3 md:order-1",
							children: [
								(0, a.jsxs)("div", {
									className: "flex items-center justify-between md:hidden",
									children: [
										(0, a.jsx)("p", {
											className: "text-sm font-medium text-muted-foreground",
											children: "Summary",
										}),
										(0, a.jsxs)(m.$, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "h-8",
											onClick: () => e_((e) => !e),
											children: [
												(0, a.jsx)(R.A, { className: "mr-2 h-3.5 w-3.5" }),
												eA ? "Hide stats" : "Show stats",
												(0, a.jsx)(z.A, {
													className: (0, B.cn)(
														"ml-2 h-3.5 w-3.5 transition-transform",
														eA && "rotate-180"
													),
												}),
											],
										}),
									],
								}),
								(0, a.jsxs)("div", {
									className: (0, B.cn)(
										"grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
										eA ? "grid" : "hidden md:grid"
									),
									children: [
										(0, a.jsx)(u.Zp, {
											className: "dms-kpi-card",
											children: (0, a.jsxs)(u.Wu, {
												className: "flex items-center gap-2.5 px-3.5 py-3",
												children: [
													(0, a.jsx)("div", {
														className:
															"shrink-0 rounded-full bg-primary/10 p-1.5",
														children: (0, a.jsx)(v.A, {
															className: "h-3.5 w-3.5 text-primary",
														}),
													}),
													(0, a.jsxs)("div", {
														className: "min-w-0",
														children: [
															(0, a.jsx)("p", {
																className:
																	"dms-stat-value text-xl sm:text-2xl",
																children: eq,
															}),
															(0, a.jsx)("p", {
																className:
																	"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																children: "Today's Appointments",
															}),
														],
													}),
												],
											}),
										}),
										(0, a.jsx)(u.Zp, {
											className: "dms-kpi-card",
											children: (0, a.jsxs)(u.Wu, {
												className: "flex items-center gap-2.5 px-3.5 py-3",
												children: [
													(0, a.jsx)("div", {
														className:
															"shrink-0 rounded-full bg-chart-3/10 p-1.5",
														children: (0, a.jsx)(b.A, {
															className: "h-3.5 w-3.5 text-chart-3",
														}),
													}),
													(0, a.jsxs)("div", {
														className: "min-w-0",
														children: [
															(0, a.jsx)("p", {
																className:
																	"dms-stat-value text-xl sm:text-2xl",
																children: eO,
															}),
															(0, a.jsx)("p", {
																className:
																	"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																children: "Arrived",
															}),
														],
													}),
												],
											}),
										}),
										(0, a.jsx)(u.Zp, {
											className: "dms-kpi-card",
											children: (0, a.jsxs)(u.Wu, {
												className: "flex items-center gap-2.5 px-3.5 py-3",
												children: [
													(0, a.jsx)("div", {
														className:
															"shrink-0 rounded-full bg-chart-4/10 p-1.5",
														children: (0, a.jsx)(g.A, {
															className: "h-3.5 w-3.5 text-chart-4",
														}),
													}),
													(0, a.jsxs)("div", {
														className: "min-w-0",
														children: [
															(0, a.jsx)("p", {
																className:
																	"dms-stat-value text-xl sm:text-2xl",
																children: eV,
															}),
															(0, a.jsx)("p", {
																className:
																	"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																children: "Pending Arrival",
															}),
														],
													}),
												],
											}),
										}),
										(0, a.jsx)(u.Zp, {
											className: "dms-kpi-card",
											children: (0, a.jsxs)(u.Wu, {
												className: "flex items-center gap-2.5 px-3.5 py-3",
												children: [
													(0, a.jsx)("div", {
														className:
															"shrink-0 rounded-full bg-destructive/10 p-1.5",
														children: (0, a.jsx)(E.A, {
															className:
																"h-3.5 w-3.5 text-destructive",
														}),
													}),
													(0, a.jsxs)("div", {
														className: "min-w-0",
														children: [
															(0, a.jsx)("p", {
																className:
																	"dms-stat-value text-xl sm:text-2xl",
																children: (eI || []).filter(
																	(e) =>
																		"VIP" === e.priority ||
																		"Urgent" === e.priority
																).length,
															}),
															(0, a.jsx)("p", {
																className:
																	"text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
																children: "Priority",
															}),
														],
													}),
												],
											}),
										}),
									],
								}),
							],
						}),
						(0, a.jsx)(Y.BN, {
							open: !!eu,
							onOpenChange: (e) => {
								e || eh(null);
							},
							title: eu || "",
							subtitle: eS?.customer_name,
							badge: eS ? { label: eS.status } : void 0,
							isLoading: eM,
							onOpenInDesk: () =>
								window.open(`/app/service-appointment/${eu}`, "_blank"),
							children:
								eS &&
								(0, a.jsxs)(a.Fragment, {
									children: [
										(0, a.jsxs)(Y.JH, {
											title: "Appointment Info",
											children: [
												(0, a.jsx)(Y.Qb, {
													label: "Status",
													value: eS.status,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Booking Source",
													value: eS.booking_source,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Priority",
													value: eS.priority,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Date & Time",
													value: eS.appointment_date_time
														? (0, n.r6)(eS.appointment_date_time)
														: void 0,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Promised Delivery",
													value: eS.promised_delivery_date_time
														? (0, n.r6)(eS.promised_delivery_date_time)
														: void 0,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Est. Duration",
													value: eS.estimated_duration_hours
														? `${eS.estimated_duration_hours} hrs`
														: void 0,
												}),
											],
										}),
										(0, a.jsxs)(Y.JH, {
											title: "Customer",
											children: [
												(0, a.jsx)(Y.Qb, {
													label: "Name",
													value: eS.customer_name,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Phone",
													value: (0, K.ms)(eS) || void 0,
												}),
												eS.mobile_no && eS.mobile_no !== eS.primary_phone
													? (0, a.jsx)(Y.Qb, {
															label: "Mobile No",
															value: eS.mobile_no,
													  })
													: null,
												(0, a.jsx)(Y.Qb, {
													label: "Email",
													value: eS.customer_email,
												}),
											],
										}),
										(0, a.jsxs)(Y.JH, {
											title: "Vehicle",
											children: [
												(0, a.jsx)(Y.Qb, {
													label: "VIN",
													value: eS.vin_number || eS.vin_chassis,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Model",
													value: eS.vehicle_model || eS.vehicle,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "License Plate",
													value: eS.license_plate,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Odometer",
													value: eS.current_odometer
														? `${eS.current_odometer} km`
														: void 0,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Warranty",
													value: eS.warranty_status,
												}),
											],
										}),
										(0, a.jsxs)(Y.JH, {
											title: "Assignment",
											children: [
												(0, a.jsx)(Y.Qb, {
													label: "Service Advisor",
													value: eS.assigned_service_advisor,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Service Bay",
													value: eS.assigned_bay,
												}),
												(0, a.jsx)(Y.Qb, {
													label: "Arrival Status",
													value: eS.vehicle_arrival_status,
												}),
											],
										}),
										eS.customer_complaint_summary &&
											(0, a.jsx)(Y.JH, {
												title: "Complaints",
												children: (0, a.jsx)("p", {
													className: "text-sm",
													children: eS.customer_complaint_summary,
												}),
											}),
										(0, a.jsxs)("div", {
											className: "flex flex-wrap justify-end gap-2 pt-2",
											children: [
												eS &&
													et(eS) &&
													(0, a.jsxs)(m.$, {
														size: "sm",
														onClick: () => {
															eh(null),
																e("appointment-new", {
																	id: eS.name,
																});
														},
														children: [
															(0, a.jsx)(A.A, {
																className: "mr-2 h-4 w-4",
															}),
															"Continue Editing",
														],
													}),
												eS &&
													ee(eS) &&
													(0, a.jsx)(m.$, {
														size: "sm",
														onClick: () => {
															ep(eS), ef(!0);
														},
														children: "Confirm",
													}),
												eS &&
													(0, K.FA)(eS) &&
													(0, a.jsxs)(m.$, {
														size: "sm",
														variant: "secondary",
														disabled: !!(0, K.ih)(eS),
														title: (0, K.ih)(eS) || void 0,
														onClick: () => {
															(0, K.ih)(eS) || (ep(eS), ew(!0));
														},
														children: [
															(0, a.jsx)(_, {
																className: "mr-2 h-4 w-4",
															}),
															"Send reminder",
														],
													}),
												eS &&
													es(eS) &&
													(0, a.jsx)(m.$, {
														size: "sm",
														variant: "secondary",
														disabled: ek,
														onClick: () => void eJ(eS),
														children: "Mark arrived",
													}),
												eS?.status === "Arrived" &&
													(0, a.jsx)(m.$, {
														size: "sm",
														variant: "secondary",
														onClick: () =>
															e("inspection-new", {
																appointment: eS.name,
															}),
														children: "Start inspection",
													}),
											],
										}),
									],
								}),
						}),
						(0, a.jsx)(J, { open: ej, onOpenChange: ef, onConfirm: eZ, loading: ek }),
						(0, a.jsx)(H, { open: eg, onOpenChange: ev, onCancel: eW, loading: ek }),
						(0, a.jsx)(G, {
							open: eb,
							onOpenChange: eN,
							initialAppointmentDateTime: ex?.appointment_date_time,
							initialPromisedDateTime: ex?.promised_delivery_date_time,
							onReschedule: eH,
							loading: ek,
						}),
						(0, a.jsx)(W, {
							open: ey,
							onOpenChange: ew,
							onSend: eG,
							loading: ek,
							customerName: ex?.customer_name,
							phone: ex ? (0, K.ms)(ex) : void 0,
						}),
					],
				});
			}
		},
		92622: (e, t, s) => {
			s.d(t, { A: () => a });
			let a = (0, s(90425).A)("funnel", [
				[
					"path",
					{
						d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",
						key: "sc7q7i",
					},
				],
			]);
		},
		98883: (e, t, s) => {
			s.d(t, { Qb: () => v, JH: () => g, BN: () => f });
			var a = s(95155);
			s(12115);
			var n = s(29483),
				r = s(33210),
				l = s(91337);
			function i({ ...e }) {
				return (0, a.jsx)(n.bL, { "data-slot": "sheet", ...e });
			}
			function d({ ...e }) {
				return (0, a.jsx)(n.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function c({ className: e, ...t }) {
				return (0, a.jsx)(n.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, l.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function o({ className: e, children: t, side: s = "right", ...i }) {
				return (0, a.jsxs)(d, {
					children: [
						(0, a.jsx)(c, {}),
						(0, a.jsxs)(n.UC, {
							"data-slot": "sheet-content",
							className: (0, l.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
								"right" === s &&
									"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
								"left" === s &&
									"data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
								"top" === s &&
									"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
								"bottom" === s &&
									"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
								e
							),
							...i,
							children: [
								t,
								(0, a.jsxs)(n.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, a.jsx)(r.A, { className: "size-4" }),
										(0, a.jsx)("span", {
											className: "sr-only",
											children: "Close",
										}),
									],
								}),
							],
						}),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, l.cn)("flex flex-col gap-1.5 p-4", e),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, a.jsx)(n.hE, {
					"data-slot": "sheet-title",
					className: (0, l.cn)("text-foreground font-semibold", e),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, a.jsx)(n.VY, {
					"data-slot": "sheet-description",
					className: (0, l.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			var x = s(38291),
				p = s(61991),
				j = s(6296);
			function f({
				open: e,
				onOpenChange: t,
				title: s,
				subtitle: n,
				badge: r,
				isLoading: d,
				onOpenInDesk: c,
				footer: g,
				contentScroll: v = "outer",
				children: b,
			}) {
				return (0, a.jsx)(i, {
					open: e,
					onOpenChange: t,
					children: (0, a.jsxs)(o, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, a.jsx)(m, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, a.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, a.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, a.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, a.jsx)(u, {
														className: "text-lg",
														children: s,
													}),
													r &&
														(0, a.jsx)(x.E, {
															variant: r.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: r.label,
														}),
												],
											}),
											n && (0, a.jsx)(h, { className: "mt-1", children: n }),
										],
									}),
								}),
							}),
							(0, a.jsx)(p.w, { className: "bg-(--dms-green)/20" }),
							d
								? (0, a.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, a.jsx)(j.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, a.jsxs)(a.Fragment, {
										children: [
											(0, a.jsx)("div", {
												className: (0, l.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === v
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: b,
											}),
											g &&
												(0, a.jsx)("div", {
													className:
														"shrink-0 border-t bg-background px-4 py-3",
													children: g,
												}),
										],
								  }),
						],
					}),
				});
			}
			function g({ title: e, children: t, className: s }) {
				return (0, a.jsxs)("div", {
					className: (0, l.cn)("space-y-2", s),
					children: [
						(0, a.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, a.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, a.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: t,
						}),
					],
				});
			}
			function v({ label: e, value: t, className: s }) {
				return (0, a.jsxs)("div", {
					className: (0, l.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						s
					),
					children: [
						(0, a.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, a.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: t || "—",
						}),
					],
				});
			}
		},
		99916: (e, t, s) => {
			s.d(t, { r: () => i });
			var a = s(95155),
				n = s(33210),
				r = s(4474),
				l = s(91337);
			function i({
				onClear: e,
				disabled: t = !1,
				label: s = "Clear filters",
				className: d,
			}) {
				return (0, a.jsxs)(r.$, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: e,
					disabled: t,
					"aria-label": s,
					title: s,
					className: (0, l.cn)("h-9 shrink-0 gap-1.5 text-muted-foreground", d),
					children: [
						(0, a.jsx)(n.A, { "aria-hidden": "true" }),
						(0, a.jsx)("span", { className: "hidden sm:inline", children: s }),
					],
				});
			}
		},
	},
]);
