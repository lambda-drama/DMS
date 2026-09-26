(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[3911, 7418],
	{
		3911: (e, t, r) => {
			"use strict";
			r.r(t), r.d(t, { default: () => v });
			var n = r(95155),
				a = r(12115),
				i = r(31521),
				s = r(4474),
				o = r(39658),
				l = r(79984),
				c = r(83786),
				d = r(38291),
				u = r(98883),
				m = r(38785),
				h = r(56313),
				p = r(21219),
				f = r(84980),
				y = r(91958),
				_ = r(61878),
				g = r(6296),
				b = r(45752),
				x = r(38807),
				S = r(66609);
			function v() {
				let [e, t] = (0, i.P)("pending-material-requests", "search", ""),
					[r, v] = (0, a.useState)([]),
					[w, N] = (0, a.useState)(!0),
					[O, j] = (0, a.useState)(null),
					[T, A] = (0, a.useState)(null),
					[$, P] = (0, a.useState)(!1),
					[k, J] = (0, a.useState)(!1),
					[q, F] = (0, a.useState)(null),
					[R, E] = (0, a.useState)(!1),
					M = (0, a.useCallback)(async () => {
						N(!0);
						try {
							v(await p.ni({ search: e || void 0, limit: 100 }));
						} catch (e) {
							S.o.error(
								e instanceof Error ? e.message : "Failed to load pending requests"
							),
								v([]);
						} finally {
							N(!1);
						}
					}, [e]);
				(0, a.useEffect)(() => {
					let e = window.setTimeout(() => {
						M();
					}, 250);
					return () => window.clearTimeout(e);
				}, [M]);
				let C = async (e) => {
						j(e), P(!0);
						try {
							A(await p.sq(e));
						} catch (e) {
							S.o.error(e instanceof Error ? e.message : "Failed to load details"),
								A(null);
						} finally {
							P(!1);
						}
					},
					I = async (e) => {
						if (O && q && !1 !== q.allowed) {
							E(!0);
							try {
								let t =
									"stock_entry" === q.action
										? await p.XG(O)
										: await p.qH(O, { supplier: e?.supplier });
								S.o.success(`${t.doctype || "Document"} ${t.name} created`),
									J(!1),
									F(null),
									j(null),
									A(null),
									M();
							} catch (e) {
								S.o.error(e instanceof Error ? e.message : "Action failed");
							} finally {
								E(!1);
							}
						}
					},
					B = T
						? {
								company: T.company,
								material_request_type: T.material_request_type,
								warehouse: T.set_warehouse,
								from_warehouse: T.set_from_warehouse,
								pending_lines: T.items.filter((e) => (e.pending_qty ?? 0) > 0)
									.length,
								pending_qty: T.items.reduce((e, t) => e + (t.pending_qty ?? 0), 0),
						  }
						: void 0;
				return (0, n.jsxs)("div", {
					className: "min-w-0 space-y-6",
					children: [
						(0, n.jsxs)("div", {
							className:
								"flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
							children: [
								(0, n.jsxs)("div", {
									children: [
										(0, n.jsxs)("h2", {
											className:
												"text-2xl font-bold tracking-tight flex items-center gap-2",
											children: [
												(0, n.jsx)(f.A, { className: "h-6 w-6" }),
												"Pending Material Requests",
											],
										}),
										(0, n.jsx)("p", {
											className: "text-sm text-muted-foreground mt-1",
											children:
												"Submitted spare-part requests waiting for transfer, issue, or receipt into the target warehouse.",
										}),
									],
								}),
								(0, n.jsxs)(s.$, {
									type: "button",
									variant: "outline",
									size: "sm",
									onClick: () => void M(),
									disabled: w,
									children: [
										(0, n.jsx)(y.A, {
											className: `h-4 w-4 mr-2 ${w ? "animate-spin" : ""}`,
										}),
										"Refresh",
									],
								}),
							],
						}),
						(0, n.jsxs)(l.Zp, {
							children: [
								(0, n.jsxs)(l.aR, {
									children: [
										(0, n.jsx)(l.ZB, { children: "Open requests" }),
										(0, n.jsx)(l.BT, {
											children:
												"Use Actions to create a Stock Entry (transfer/issue) or Purchase Receipt (purchase) for the requested warehouse.",
										}),
									],
								}),
								(0, n.jsxs)(l.Wu, {
									className: "space-y-4",
									children: [
										(0, n.jsxs)("div", {
											className: "relative max-w-sm",
											children: [
												(0, n.jsx)(_.A, {
													className:
														"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
												}),
												(0, n.jsx)(o.p, {
													className: "pl-9",
													placeholder: "Search request ID…",
													value: e,
													onChange: (e) => t(e.target.value),
												}),
											],
										}),
										w
											? (0, n.jsx)("div", {
													className: "flex justify-center py-12",
													children: (0, n.jsx)(g.A, {
														className:
															"h-6 w-6 animate-spin text-muted-foreground",
													}),
											  })
											: 0 === r.length
											? (0, n.jsx)("p", {
													className:
														"text-sm text-muted-foreground py-8 text-center",
													children: "No pending material requests.",
											  })
											: (0, n.jsxs)(c.XI, {
													children: [
														(0, n.jsx)(c.A0, {
															children: (0, n.jsxs)(c.Hj, {
																children: [
																	(0, n.jsx)(c.nd, {
																		children: "ID",
																	}),
																	(0, n.jsx)(c.nd, {
																		children: "Purpose",
																	}),
																	(0, n.jsx)(c.nd, {
																		children: "Company",
																	}),
																	(0, n.jsx)(c.nd, {
																		children: "Required by",
																	}),
																	(0, n.jsx)(c.nd, {
																		children: "Warehouse",
																	}),
																	(0, n.jsx)(c.nd, {
																		children: "Pending",
																	}),
																	(0, n.jsx)(c.nd, {
																		children: "Status",
																	}),
																	(0, n.jsx)(c.nd, {
																		className: "text-right",
																		children: "Actions",
																	}),
																],
															}),
														}),
														(0, n.jsx)(c.BF, {
															children: r.map((e) =>
																(0, n.jsxs)(
																	c.Hj,
																	{
																		className:
																			"cursor-pointer",
																		onClick: () =>
																			void C(e.name),
																		children: [
																			(0, n.jsx)(c.nA, {
																				className:
																					"font-medium",
																				children: e.name,
																			}),
																			(0, n.jsx)(c.nA, {
																				children:
																					e.material_request_type,
																			}),
																			(0, n.jsx)(c.nA, {
																				children:
																					e.company,
																			}),
																			(0, n.jsx)(c.nA, {
																				children:
																					e.schedule_date ||
																					e.transaction_date,
																			}),
																			(0, n.jsx)(c.nA, {
																				className:
																					"max-w-[160px] truncate",
																				children:
																					"Material Transfer" ===
																					e.material_request_type
																						? [
																								e.from_warehouse,
																								e.warehouse,
																						  ]
																								.filter(
																									Boolean
																								)
																								.join(
																									" → "
																								)
																						: e.warehouse ||
																						  "—",
																			}),
																			(0, n.jsxs)(c.nA, {
																				children: [
																					e.pending_lines ??
																						0,
																					" line(s)",
																					null !=
																					e.pending_qty
																						? ` \xb7 ${e.pending_qty}`
																						: "",
																				],
																			}),
																			(0, n.jsx)(c.nA, {
																				children: (0,
																				n.jsx)(d.E, {
																					variant:
																						"secondary",
																					children:
																						e.status,
																				}),
																			}),
																			(0, n.jsx)(c.nA, {
																				className:
																					"text-right",
																				onClick: (e) =>
																					e.stopPropagation(),
																				children: e.actions
																					?.length
																					? (0, n.jsx)(
																							m.o,
																							{
																								name: e.name,
																								actions:
																									e.actions,
																								context:
																									{
																										company:
																											e.company,
																										material_request_type:
																											e.material_request_type,
																										warehouse:
																											e.warehouse,
																										from_warehouse:
																											e.from_warehouse,
																										pending_lines:
																											e.pending_lines,
																										pending_qty:
																											e.pending_qty,
																									},
																								onDone: () =>
																									void M(),
																							}
																					  )
																					: null,
																			}),
																		],
																	},
																	e.name
																)
															),
														}),
													],
											  }),
									],
								}),
							],
						}),
						(0, n.jsx)(u.BN, {
							open: !!O,
							onOpenChange: (e) => {
								e || (j(null), A(null));
							},
							title: T?.name || O || "Material Request",
							description: T?.material_request_type,
							loading: $,
							children:
								T &&
								(0, n.jsxs)(n.Fragment, {
									children: [
										(0, n.jsxs)(u.JH, {
											title: "Request",
											children: [
												(0, n.jsx)(u.Qb, {
													label: "Purpose",
													value: T.material_request_type,
												}),
												(0, n.jsx)(u.Qb, {
													label: "Company",
													value: T.company,
												}),
												(0, n.jsx)(u.Qb, {
													label: "Required by",
													value: T.schedule_date,
												}),
												(0, n.jsx)(u.Qb, {
													label: "Status",
													value: T.status,
												}),
												T.set_from_warehouse &&
													(0, n.jsx)(u.Qb, {
														label: "From warehouse",
														value: T.set_from_warehouse,
													}),
												T.set_warehouse &&
													(0, n.jsx)(u.Qb, {
														label: "To warehouse",
														value: T.set_warehouse,
													}),
											],
										}),
										(0, n.jsx)(u.JH, {
											title: "Items",
											children: (0, n.jsxs)(c.XI, {
												children: [
													(0, n.jsx)(c.A0, {
														children: (0, n.jsxs)(c.Hj, {
															children: [
																(0, n.jsx)(c.nd, {
																	children: "Item",
																}),
																(0, n.jsx)(c.nd, {
																	className: "text-right",
																	children: "Requested",
																}),
																(0, n.jsx)(c.nd, {
																	className: "text-right",
																	children: "Pending",
																}),
																(0, n.jsx)(c.nd, {
																	children: "Warehouse",
																}),
															],
														}),
													}),
													(0, n.jsx)(c.BF, {
														children: T.items.map((e) =>
															(0, n.jsxs)(
																c.Hj,
																{
																	children: [
																		(0, n.jsxs)(c.nA, {
																			children: [
																				(0, n.jsx)("div", {
																					className:
																						"font-medium",
																					children:
																						e.item_name ||
																						e.item_code,
																				}),
																				(0, n.jsx)("div", {
																					className:
																						"text-xs text-muted-foreground",
																					children:
																						e.item_code,
																				}),
																			],
																		}),
																		(0, n.jsxs)(c.nA, {
																			className:
																				"text-right",
																			children: [
																				e.stock_qty,
																				e.uom
																					? ` ${e.uom}`
																					: "",
																			],
																		}),
																		(0, n.jsx)(c.nA, {
																			className:
																				"text-right font-medium",
																			children:
																				e.pending_qty,
																		}),
																		(0, n.jsx)(c.nA, {
																			className: "text-sm",
																			children:
																				e.warehouse ||
																				T.set_warehouse ||
																				"—",
																		}),
																	],
																},
																e.name
															)
														),
													}),
												],
											}),
										}),
										(T.actions?.length ?? 0) > 0 &&
											(0, n.jsx)("div", {
												className: "flex flex-wrap gap-2 pt-2",
												children: T.actions.map((e) =>
													(0, n.jsxs)(
														s.$,
														{
															type: "button",
															disabled: R || !1 === e.allowed,
															onClick: () => {
																F(e), J(!0);
															},
															children: [
																"stock_entry" === e.action
																	? (0, n.jsx)(b.A, {
																			className:
																				"h-4 w-4 mr-2",
																	  })
																	: (0, n.jsx)(x.A, {
																			className:
																				"h-4 w-4 mr-2",
																	  }),
																e.label,
															],
														},
														e.action
													)
												),
											}),
									],
								}),
						}),
						(0, n.jsx)(h.$, {
							open: k,
							onOpenChange: (e) => {
								J(e), e || R || F(null);
							},
							action: q,
							materialRequestName: O || T?.name || "",
							context: B,
							loading: R,
							onConfirm: I,
						}),
					],
				});
			}
		},
		5240: (e, t, r) => {
			"use strict";
			function n(e, t, r) {
				return new Promise((n, a) => {
					e.toBlob((e) => (e ? n(e) : a(Error("Image compression failed"))), t, r);
				});
			}
			async function a(e, t, r, a) {
				let { width: i, height: s } = (function (e, t, r) {
						let n = Math.max(e, t);
						if (n <= r) return { width: e, height: t };
						let a = r / n;
						return {
							width: Math.max(1, Math.round(e * a)),
							height: Math.max(1, Math.round(t * a)),
						};
					})(e.naturalWidth || e.width, e.naturalHeight || e.height, t),
					o = document.createElement("canvas");
				(o.width = i), (o.height = s);
				let l = o.getContext("2d");
				if (!l) throw Error("Canvas not supported");
				return (l.drawImage(e, 0, 0, i, s), a) ? n(o, "image/png") : n(o, "image/jpeg", r);
			}
			async function i(e, t) {
				if (!e.type.startsWith("image/")) return e;
				let r = t?.skipBelowBytes ?? 4e5;
				if (e.size <= r) return e;
				let n = t?.targetMaxBytes ?? 14e5,
					i = "image/png" === e.type;
				try {
					let r = await new Promise((t, r) => {
							let n = URL.createObjectURL(e),
								a = new Image();
							(a.onload = () => {
								URL.revokeObjectURL(n), t(a);
							}),
								(a.onerror = () => {
									URL.revokeObjectURL(n), r(Error("Could not read image"));
								}),
								(a.src = n);
						}),
						s = [
							{ maxSide: t?.maxSide ?? 1920, quality: t?.quality ?? 0.82 },
							{ maxSide: 1280, quality: 0.72 },
							{ maxSide: 1024, quality: 0.65 },
						],
						o = null;
					for (let e of s)
						if ((o = await a(r, e.maxSide, e.quality, i)).size <= n) break;
					if (!o || (o.size >= e.size && e.size <= n)) return e;
					let l = i ? ".png" : ".jpg",
						c = i ? "image/png" : "image/jpeg",
						d = (e.name.replace(/\.[^.]+$/, "") || "image").slice(0, 120);
					return new File([o], `${d}${l}`, { type: c, lastModified: Date.now() });
				} catch {
					return e;
				}
			}
			r.d(t, {
				r4: () => J,
				n6: () => w,
				_N: () => k,
				CW: () => q,
				t4: () => y,
				d_: () => B,
				gn: () => f,
				ll: () => b,
				Mo: () => R,
				Iy: () => C,
				$_: () => O,
				Z9: () => E,
				zK: () => T,
				QF: () => F,
				OK: () => A,
				_L: () => j,
				bf: () => S,
				IQ: () => g,
				hz: () => v,
				J$: () => p,
				W6: () => $,
				hQ: () => N,
				Z7: () => P,
				UO: () => x,
				Y: () => l,
				_3: () => c,
				sJ: () => u,
				lE: () => d,
				KU: () => _,
				QM: () => I,
				mW: () => m,
			});
			var s = r(49876);
			let o = "dms.api.common";
			function l(e) {
				let t = String(e?.oem_part_number || e?.item_code || e?.name || "").trim(),
					r = String(e?.item_name || e?.name || t).trim();
				return t && r && t !== r ? `${t}: ${r}` : r || t;
			}
			function c(e) {
				var t;
				let r = [],
					n = String(e?.item_code || e?.spare_part_item || "").trim();
				return (
					n && n !== e?.name && r.push(n),
					e?.part_category && r.push(e.part_category),
					e?.bin_location && r.push(`Bin: ${e.bin_location}`),
					e?.stock_available != null &&
						Number.isFinite(Number(e.stock_available)) &&
						r.push(
							`Stock: ${
								!Number.isFinite((t = Number(e.stock_available)))
									? "0"
									: Number.isInteger(t)
									? String(t)
									: t.toFixed(2)
							}`
						),
					r.length ? r.join(" \xb7 ") : void 0
				);
			}
			function d(e) {
				return { value: e.name, label: l(e), description: c(e) };
			}
			function u(e) {
				let t = String(e?.custom_service_code || "").trim(),
					r = String(e?.custom_item_name || e?.service_item || e?.name || t).trim();
				return t && r && t !== r ? `${t}: ${r}` : r || t;
			}
			function m(e) {
				if (e?.estimated_hours != null && Number(e.estimated_hours) > 0)
					return Number(e.estimated_hours);
				let t = parseFloat(String(e?.custom_estimated_timehours ?? ""));
				return Number.isFinite(t) && t > 0 ? t : 0;
			}
			function h(e) {
				let t = "number" == typeof e ? e : parseFloat(String(e ?? ""));
				return Number.isFinite(t) ? t : 0;
			}
			async function p(e) {
				let t = await (0, s.AT)(
					`/api/method/${o}.get_vehicle_service_item_line_defaults`,
					{ method: "POST", body: JSON.stringify({ vehicle_service_item: e }) }
				);
				return {
					rate_per_hour: h(t?.rate_per_hour),
					estimated_hours: h(t?.estimated_hours),
					service_name: t?.service_name,
					service_code: t?.service_code,
				};
			}
			async function f(e, t, r) {
				return (0, s.AT)(`/api/method/${o}.get_customers`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, limit: t || 50, offset: r || 0 }),
				});
			}
			async function y(e) {
				return (0, s.AT)(`/api/method/${o}.get_customer_contact`, {
					method: "POST",
					body: JSON.stringify({ customer: e }),
				});
			}
			async function _(e, t) {
				return (0, s.AT)(`/api/method/${o}.update_customer_contact`, {
					method: "POST",
					body: JSON.stringify({ customer: e, data: t }),
				});
			}
			async function g() {
				return (0, s.AT)(`/api/method/${o}.get_vehicle_customer_group_options`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function b() {
				return (0, s.AT)(`/api/method/${o}.get_dms_customer_defaults`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function x() {
				return (0, s.AT)(`/api/method/${o}.get_workspace_access`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function S(e, t) {
				return (0, s.AT)(`/api/method/${o}.get_vins`, {
					method: "POST",
					body: JSON.stringify({ customer: e || null, search: t || null }),
				});
			}
			async function v(e, t, r) {
				return (0, s.AT)(`/api/method/${o}.get_vehicle_models`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, brand: t || null, limit: r ?? 30 }),
				});
			}
			async function w(e, t) {
				return (0, s.AT)(`/api/method/${o}.get_colors`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, limit: t ?? 40 }),
				});
			}
			async function N(e) {
				return (0, s.AT)(`/api/method/${o}.get_vehicle_service_types`, {
					method: "POST",
					body: JSON.stringify({ search: e || null }),
				});
			}
			async function O() {
				return (0, s.AT)(`/api/method/${o}.get_service_advisors`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function j() {
				return (0, s.AT)(`/api/method/${o}.get_technicians`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function T(e) {
				return (0, s.AT)(`/api/method/${o}.get_service_bays`, {
					method: "POST",
					body: JSON.stringify({ status: e || null }),
				});
			}
			async function A(e, t, r, n, a, i) {
				return (0, s.AT)(`/api/method/${o}.get_spare_parts`, {
					method: "POST",
					body: JSON.stringify({
						search: e || null,
						warehouse: t || null,
						company: r || null,
						vehicle_model: n || null,
						vin: a || null,
						vehicle_brand: i || null,
					}),
				});
			}
			async function $(e, t, r, n = 50) {
				return (0, s.AT)(`/api/method/${o}.get_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify({
						search: e || null,
						vehicle_model: t || null,
						vin: r || null,
						limit: n,
					}),
				});
			}
			async function P(e, t) {
				return (0, s.AT)(`/api/method/${o}.get_warehouses`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, company: t || null }),
				});
			}
			async function k(e) {
				return (0, s.AT)(`/api/method/${o}.get_companies`, {
					method: "POST",
					body: JSON.stringify({ search: e || null }),
				});
			}
			async function J(e, t) {
				return (0, s.AT)(`/api/method/${o}.get_branches`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, company: t || null }),
				});
			}
			async function q() {
				return (0, s.AT)(`/api/method/${o}.get_currencies`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function F(e) {
				let t = await (0, s.AT)(`/api/method/${o}.get_spare_part_price`, {
						method: "POST",
						body: JSON.stringify({ spare_part: e }),
					}),
					r = "number" == typeof t ? t : parseFloat(String(t ?? ""));
				return Number.isFinite(r) ? r : 0;
			}
			async function R(e) {
				return (0, s.AT)(`/api/method/${o}.get_labour_rate`, {
					method: "POST",
					body: JSON.stringify({ vehicle_service_item: e }),
				});
			}
			async function E(e) {
				return (0, s.AT)(`/api/method/${o}.get_service_bay_detail`, {
					method: "POST",
					body: JSON.stringify({ bay_name: e }),
				});
			}
			let M = new Map();
			async function C(e) {
				if (!e) return ["Standard"];
				let t = M.get(e);
				if (t) return t;
				let r = await (0, s.AT)(`/api/method/${o}.get_print_formats`, {
						method: "POST",
						body: JSON.stringify({ doctype: e }),
					}),
					n = Array.isArray(r) && r.length ? r : ["Standard"];
				return M.set(e, n), n;
			}
			async function I(e) {
				let t = await i(e);
				await (0, s.bd)();
				let r = window.csrf_token,
					n = new FormData();
				n.append("file", t),
					n.append("is_private", "0"),
					n.append("folder", "Home/Attachments"),
					r && n.append("csrf_token", r);
				let a = window.location.origin,
					o = await fetch(`${a}/api/method/upload_file`, {
						method: "POST",
						headers: r ? { "X-Frappe-CSRF-Token": r } : {},
						body: n,
						credentials: "include",
					}),
					l = await o.json().catch(() => ({}));
				if (l?.exc) {
					let e = "Upload failed";
					try {
						let t = JSON.parse(l._server_messages || "[]"),
							r = JSON.parse(t[0] || "{}");
						e = r?.message || l?.message || e;
					} catch {
						e = l?.message || e;
					}
					throw Error(e);
				}
				if (!o.ok) throw Error(`Upload failed: HTTP ${o.status}`);
				let c = l?.message;
				if (c && "object" == typeof c && c.file_url) return c.file_url;
				if ("string" == typeof c && c.startsWith("/")) return c;
				throw Error("Upload failed: no file URL in response");
			}
			async function B() {
				return (0, s.AT)(`/api/method/${o}.get_customer_terms_and_conditions`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
		},
		18684: (e, t, r) => {
			Promise.resolve().then(r.bind(r, 3911));
		},
		21219: (e, t, r) => {
			"use strict";
			r.d(t, {
				$m: () => c,
				Kd: () => j,
				Pg: () => N,
				R: () => O,
				XG: () => _,
				XI: () => T,
				ZO: () => i,
				Zj: () => v,
				aK: () => l,
				bn: () => d,
				gk: () => s,
				ju: () => o,
				jx: () => w,
				mH: () => A,
				mQ: () => h,
				mx: () => S,
				ni: () => f,
				pc: () => u,
				qH: () => g,
				rW: () => b,
				sE: () => m,
				sn: () => x,
				sq: () => y,
				vX: () => p,
				w_: () => $,
			});
			var n = r(49876);
			let a = "dms.api.stock_operations";
			function i(e) {
				let t = e.warehouse_name || e.name;
				return e.workshop_name && e.workshop_name !== t
					? `${e.workshop_name} — ${t}`
					: e.dms_label && e.dms_label !== t
					? `${e.dms_label} — ${t}`
					: t;
			}
			async function s(e) {
				return (0, n.AT)(`/api/method/${a}.get_stock_operation_defaults_api`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function o(e, t, r = 20) {
				return (0, n.AT)(`/api/method/${a}.search_stock_items_for_ui`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, warehouse: t || null, limit: r }),
				});
			}
			async function l(e) {
				return (0, n.AT)(`/api/method/${a}.get_stock_entry_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function c(e) {
				return (0, n.AT)(`/api/method/${a}.get_stock_entries`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
						posting_from: e?.posting_from || null,
						posting_to: e?.posting_to || null,
					}),
				});
			}
			async function d(e) {
				return (0, n.AT)(`/api/method/${a}.get_stock_reconciliations`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function u(e) {
				return (0, n.AT)(`/api/method/${a}.get_material_request_defaults_api`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function m(e) {
				return (0, n.AT)(`/api/method/${a}.get_material_requests`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function h(e) {
				return (0, n.AT)(`/api/method/${a}.get_item_uoms_for_ui_api`, {
					method: "POST",
					body: JSON.stringify({ item_code: e }),
				});
			}
			async function p(e) {
				return (0, n.AT)(`/api/method/${a}.create_material_request`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function f(e) {
				return (0, n.AT)(`/api/method/${a}.get_pending_material_requests`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function y(e) {
				return (0, n.AT)(`/api/method/${a}.get_material_request_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function _(e, t = !0) {
				return (0, n.AT)(`/api/method/${a}.create_stock_entry_from_material_request`, {
					method: "POST",
					body: JSON.stringify({ name: e, submit: +!!t }),
				});
			}
			async function g(e, t) {
				return (0, n.AT)(
					`/api/method/${a}.create_purchase_receipt_from_material_request`,
					{
						method: "POST",
						body: JSON.stringify({
							name: e,
							supplier: t?.supplier || null,
							submit: +(t?.submit !== !1),
						}),
					}
				);
			}
			async function b(e) {
				return (0, n.AT)(`/api/method/${a}.create_stock_entry`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function x(e) {
				return (0, n.AT)(`/api/method/${a}.create_stock_reconciliation`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function S(e) {
				return (0, n.AT)(`/api/method/${a}.get_purchase_receipt_defaults_api`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function v(e, t = 20) {
				return (0, n.AT)(`/api/method/${a}.search_suppliers_for_ui`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, limit: t }),
				});
			}
			async function w(e) {
				return (0, n.AT)(`/api/method/${a}.create_supplier`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function N(e) {
				return (0, n.AT)(`/api/method/${a}.get_purchase_receipts`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function O(e) {
				return (0, n.AT)(`/api/method/${a}.get_purchase_receipt_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function j(e) {
				return (0, n.AT)(`/api/method/${a}.create_purchase_receipt`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function T(e, t) {
				let r = await (0, n.AT)(`/api/method/${a}.get_item_price_list_rate_api`, {
					method: "POST",
					body: JSON.stringify({ item_code: e, price_list: t }),
				});
				return Number(r?.rate || 0);
			}
			async function A() {
				return (0, n.AT)(`/api/method/${a}.get_stock_item_create_defaults_api`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function $(e) {
				return (0, n.AT)(`/api/method/${a}.create_stock_item`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
		},
		31521: (e, t, r) => {
			"use strict";
			r.d(t, { P: () => a });
			var n = r(12115);
			function a(e, t, r) {
				let a = `dms:listFilters:${e}:${t}`,
					[i, s] = (0, n.useState)(() => {
						let e = (function (e) {
							try {
								let t = window.localStorage.getItem(e);
								if (null === t) return;
								return JSON.parse(t);
							} catch {
								return;
							}
						})(a);
						return void 0 === e ? r : e;
					});
				return (
					(0, n.useEffect)(() => {
						try {
							JSON.stringify(i) === JSON.stringify(r)
								? window.localStorage.removeItem(a)
								: window.localStorage.setItem(a, JSON.stringify(i));
						} catch {}
					}, [a, i, r]),
					[i, s]
				);
			}
		},
		33210: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("x", [
				["path", { d: "M18 6 6 18", key: "1bl5f8" }],
				["path", { d: "m6 6 12 12", key: "d8bk6v" }],
			]);
		},
		38291: (e, t, r) => {
			"use strict";
			r.d(t, { E: () => l });
			var n = r(95155);
			r(12115);
			var a = r(42442),
				i = r(18460),
				s = r(91337);
			let o = (0, i.F)(
				"inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
				{
					variants: {
						variant: {
							default:
								"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
							secondary:
								"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
							destructive:
								"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
							outline:
								"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
						},
					},
					defaultVariants: { variant: "default" },
				}
			);
			function l({ className: e, variant: t, asChild: r = !1, ...i }) {
				let c = r ? a.DX : "span";
				return (0, n.jsx)(c, {
					"data-slot": "badge",
					className: (0, s.cn)(o({ variant: t }), e),
					...i,
				});
			}
		},
		51914: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("plus", [
				["path", { d: "M5 12h14", key: "1ays0h" }],
				["path", { d: "M12 5v14", key: "s699le" }],
			]);
		},
		56563: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("chevrons-up-down", [
				["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
				["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }],
			]);
		},
		79792: (e, t, r) => {
			"use strict";
			r.d(t, { J: () => s });
			var n = r(95155);
			r(12115);
			var a = r(91760),
				i = r(91337);
			function s({ className: e, ...t }) {
				return (0, n.jsx)(a.b, {
					"data-slot": "label",
					className: (0, i.cn)(
						"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
						e
					),
					...t,
				});
			}
		},
		79984: (e, t, r) => {
			"use strict";
			r.d(t, { BT: () => l, Wu: () => c, ZB: () => o, Zp: () => i, aR: () => s });
			var n = r(95155);
			r(12115);
			var a = r(91337);
			function i({ className: e, ...t }) {
				return (0, n.jsx)("div", {
					"data-slot": "card",
					className: (0, a.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function s({ className: e, ...t }) {
				return (0, n.jsx)("div", {
					"data-slot": "card-header",
					className: (0, a.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, n.jsx)("div", {
					"data-slot": "card-title",
					className: (0, a.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, n.jsx)("div", {
					"data-slot": "card-description",
					className: (0, a.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, n.jsx)("div", {
					"data-slot": "card-content",
					className: (0, a.cn)("px-4", e),
					...t,
				});
			}
		},
		83786: (e, t, r) => {
			"use strict";
			r.d(t, {
				A0: () => s,
				BF: () => o,
				Hj: () => l,
				XI: () => i,
				nA: () => d,
				nd: () => c,
			});
			var n = r(95155);
			r(12115);
			var a = r(91337);
			function i({ className: e, ...t }) {
				return (0, n.jsx)("div", {
					"data-slot": "table-container",
					className: "relative w-full overflow-x-auto",
					children: (0, n.jsx)("table", {
						"data-slot": "table",
						className: (0, a.cn)("w-full caption-bottom text-sm", e),
						...t,
					}),
				});
			}
			function s({ className: e, ...t }) {
				return (0, n.jsx)("thead", {
					"data-slot": "table-header",
					className: (0, a.cn)("[&_tr]:border-b", e),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, n.jsx)("tbody", {
					"data-slot": "table-body",
					className: (0, a.cn)("[&_tr:last-child]:border-0", e),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, n.jsx)("tr", {
					"data-slot": "table-row",
					className: (0, a.cn)(
						"hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
						e
					),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, n.jsx)("th", {
					"data-slot": "table-head",
					className: (0, a.cn)(
						"text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
						e
					),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, n.jsx)("td", {
					"data-slot": "table-cell",
					className: (0, a.cn)(
						"p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
						e
					),
					...t,
				});
			}
		},
		91760: (e, t, r) => {
			"use strict";
			r.d(t, { b: () => l });
			var n = r(12115);
			r(47650);
			var a = r(42442),
				i = r(95155),
				s = [
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
						s = n.forwardRef((e, n) => {
							let { asChild: a, ...s } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, i.jsx)(a ? r : t, { ...s, ref: n })
							);
						});
					return (s.displayName = `Primitive.${t}`), { ...e, [t]: s };
				}, {}),
				o = n.forwardRef((e, t) =>
					(0, i.jsx)(s.label, {
						...e,
						ref: t,
						onMouseDown: (t) => {
							t.target.closest("button, input, select, textarea") ||
								(e.onMouseDown?.(t),
								!t.defaultPrevented && t.detail > 1 && t.preventDefault());
						},
					})
				);
			o.displayName = "Label";
			var l = o;
		},
		94514: (e, t, r) => {
			"use strict";
			r.d(t, { A: () => n });
			let n = (0, r(90425).A)("check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
		},
	},
	(e) => {
		e.O(
			0,
			[5139, 878, 8409, 6609, 410, 7605, 1602, 1108, 4787, 2372, 4035, 8441, 3794, 7358],
			() => e((e.s = 18684))
		),
			(_N_E = e.O());
	},
]);
