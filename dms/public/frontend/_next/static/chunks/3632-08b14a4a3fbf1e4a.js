"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[3632],
	{
		7926: (e, t, n) => {
			n.d(t, { F: () => f, g: () => g });
			var s = n(95155),
				r = n(12115),
				a = n(56558),
				i = n(48368),
				l = n(22164),
				o = n(68459),
				d = n(6296),
				c = n(21975),
				m = n(66609),
				u = n(4474),
				x = n(79984),
				h = n(59189),
				p = n(5240);
			function f(e) {
				let t = e.split("?")[0].split("/").pop() || e;
				try {
					return decodeURIComponent(t);
				} catch {
					return t;
				}
			}
			function g({
				title: e = "Attachment",
				description: t,
				value: n,
				onChange: v,
				disabled: w = !1,
				busy: j = !1,
				className: b,
			}) {
				let N = (0, r.useRef)(null),
					[y, C] = (0, r.useState)(!1),
					[k, A] = (0, r.useState)(!1),
					S = !v,
					$ = j || y;
				async function z(e) {
					if (v) {
						C(!0);
						try {
							let t = await (0, p.QM)(e);
							await v(t), m.o.success("Attachment uploaded");
						} catch (e) {
							m.o.error(
								e instanceof Error ? e.message : "Could not upload the file"
							);
						} finally {
							C(!1), N.current && (N.current.value = "");
						}
					}
				}
				return (0, s.jsxs)(s.Fragment, {
					children: [
						(0, s.jsxs)(x.Zp, {
							className: b,
							children: [
								(0, s.jsxs)(x.aR, {
									children: [
										(0, s.jsxs)(x.ZB, {
											className: "flex items-center gap-2 text-base",
											children: [
												(0, s.jsx)(a.A, { className: "h-4 w-4" }),
												e,
											],
										}),
										t ? (0, s.jsx)(x.BT, { children: t }) : null,
									],
								}),
								(0, s.jsxs)(x.Wu, {
									className: "space-y-3",
									children: [
										n
											? (0, s.jsxs)("div", {
													className:
														"flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2",
													children: [
														(0, s.jsx)(i.A, {
															className:
																"h-4 w-4 shrink-0 text-muted-foreground",
														}),
														(0, s.jsx)("button", {
															type: "button",
															onClick: () => A(!0),
															title: "View attachment",
															className:
																"min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline",
															children: f(n),
														}),
														(0, s.jsx)("a", {
															href: n,
															target: "_blank",
															rel: "noopener noreferrer",
															"aria-label": "Open in new tab",
															title: "Open in new tab",
															className:
																"shrink-0 text-muted-foreground transition-colors hover:text-foreground",
															children: (0, s.jsx)(l.A, {
																className: "h-4 w-4",
															}),
														}),
														S
															? null
															: (0, s.jsx)(u.$, {
																	type: "button",
																	variant: "ghost",
																	size: "icon",
																	className:
																		"h-8 w-8 text-destructive",
																	disabled: $,
																	"aria-label":
																		"Remove attachment",
																	onClick: () => void v?.(""),
																	children: (0, s.jsx)(o.A, {
																		className: "h-4 w-4",
																	}),
															  }),
													],
											  })
											: (0, s.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "No attachment yet.",
											  }),
										S
											? null
											: (0, s.jsxs)(s.Fragment, {
													children: [
														(0, s.jsx)("input", {
															ref: N,
															type: "file",
															className: "hidden",
															onChange: (e) => {
																let t = e.target.files?.[0];
																t && z(t);
															},
														}),
														(0, s.jsxs)(u.$, {
															type: "button",
															variant: "outline",
															size: "sm",
															disabled: w || $,
															onClick: () => N.current?.click(),
															children: [
																$
																	? (0, s.jsx)(d.A, {
																			className:
																				"mr-2 h-4 w-4 animate-spin",
																	  })
																	: (0, s.jsx)(c.A, {
																			className:
																				"mr-2 h-4 w-4",
																	  }),
																n ? "Replace file" : "Upload file",
															],
														}),
													],
											  }),
									],
								}),
							],
						}),
						(0, s.jsx)(h.d, { open: k, onOpenChange: A, url: n, title: n ? f(n) : e }),
					],
				});
			}
		},
		21749: (e, t, n) => {
			function s(e, t) {
				if (e) return t?.find((t) => t.name === e)?.full_name || void 0;
			}
			function r(e, t, n) {
				let r = (t || "").trim();
				if (r) return r;
				let a = s(e || void 0, n);
				return a || (e || "").trim();
			}
			n.d(t, { g: () => s, i: () => r });
		},
		30069: (e, t, n) => {
			n.d(t, { g: () => c });
			var s = n(95155),
				r = n(12115),
				a = n(6296),
				i = n(37618),
				l = n(68459),
				o = n(94514),
				d = n(4474);
			function c({
				onSave: e,
				onClear: t,
				existingUrl: n,
				uploading: m = !1,
				disabled: u = !1,
				className: x = "",
			}) {
				let h = (0, r.useRef)(null),
					p = (0, r.useRef)(null),
					f = (0, r.useRef)(!1),
					g = (0, r.useRef)(!1),
					[v, w] = (0, r.useState)(!1),
					[j, b] = (0, r.useState)(n ? "done" : "idle");
				(0, r.useEffect)(() => {
					n && b("done");
				}, [n]);
				let N = (0, r.useCallback)((e = !1) => {
						let t = h.current,
							n = p.current;
						if (!t || !n) return null;
						let s = n.clientWidth;
						if (s < 1) return null;
						let r = Math.min(window.devicePixelRatio || 1, 3);
						(t.width = Math.floor(s * r)),
							(t.height = Math.floor(144 * r)),
							(t.style.width = "100%"),
							(t.style.maxWidth = "100%"),
							(t.style.height = "144px");
						let a = t.getContext("2d");
						return a
							? (a.setTransform(1, 0, 0, 1, 0, 0),
							  a.scale(r, r),
							  (a.strokeStyle = "#1e293b"),
							  (a.lineWidth = 2.2),
							  (a.lineCap = "round"),
							  (a.lineJoin = "round"),
							  e && a.clearRect(0, 0, s, 144),
							  (g.current = !0),
							  a)
							: null;
					}, []),
					y = (0, r.useCallback)((e, t) => {
						let n = t.getBoundingClientRect();
						return n.width < 1 || n.height < 1
							? { x: 0, y: 0 }
							: e.target === t &&
							  Number.isFinite(e.offsetX) &&
							  Number.isFinite(e.offsetY)
							? { x: e.offsetX, y: e.offsetY }
							: {
									x: Math.max(0, Math.min(n.width, e.clientX - n.left)),
									y: Math.max(0, Math.min(n.height, e.clientY - n.top)),
							  };
					}, []);
				(0, r.useEffect)(() => {
					if ("drawing" !== j) {
						g.current = !1;
						return;
					}
					let e = h.current,
						t = p.current;
					if (!e || !t) return;
					w(!1), N(!0);
					let n = new ResizeObserver(() => {
						f.current || N(!0);
					});
					n.observe(t);
					let s = (t) => {
							if (u || m) return;
							("touch" === t.pointerType || "pen" === t.pointerType) &&
								t.preventDefault(),
								g.current || N(!0);
							let n = e.getContext("2d");
							if (!n) return;
							e.setPointerCapture(t.pointerId), (f.current = !0);
							let s = y(t, e);
							n.beginPath(), n.moveTo(s.x, s.y);
						},
						r = (t) => {
							if (!f.current) return;
							("touch" === t.pointerType || "pen" === t.pointerType) &&
								t.preventDefault();
							let n = e.getContext("2d");
							if (!n) return;
							let s = y(t, e);
							n.lineTo(s.x, s.y), n.stroke(), w(!0);
						},
						a = (t) => {
							if (f.current) {
								f.current = !1;
								try {
									e.releasePointerCapture(t.pointerId);
								} catch {}
							}
						};
					return (
						e.addEventListener("pointerdown", s),
						e.addEventListener("pointermove", r),
						e.addEventListener("pointerup", a),
						e.addEventListener("pointercancel", a),
						e.addEventListener("pointerleave", a),
						() => {
							n.disconnect(),
								e.removeEventListener("pointerdown", s),
								e.removeEventListener("pointermove", r),
								e.removeEventListener("pointerup", a),
								e.removeEventListener("pointercancel", a),
								e.removeEventListener("pointerleave", a);
						}
					);
				}, [j, u, m, N, y]);
				let C = () => {
					N(!0), w(!1), t?.();
				};
				return m
					? (0, s.jsxs)("div", {
							className: `flex min-h-[120px] w-full min-w-0 max-w-full items-center justify-center rounded-lg border border-dashed bg-muted/30 ${x}`,
							children: [
								(0, s.jsx)(a.A, {
									className: "h-6 w-6 animate-spin text-muted-foreground",
								}),
								(0, s.jsx)("span", {
									className: "ml-2 text-sm text-muted-foreground",
									children: "Saving signature…",
								}),
							],
					  })
					: "idle" === j
					? (0, s.jsxs)("button", {
							type: "button",
							disabled: u,
							onClick: () => b("drawing"),
							className: `flex min-h-[120px] w-full min-w-0 max-w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground transition-colors hover:border-[var(--dms-green)] hover:bg-[var(--dms-green-light)]/30 hover:text-foreground disabled:opacity-50 ${x}`,
							children: [
								(0, s.jsx)(i.A, { className: "h-5 w-5" }),
								(0, s.jsx)("span", {
									className: "text-sm font-medium",
									children: "Customer digital signature",
								}),
								(0, s.jsx)("span", {
									className: "text-xs",
									children: "Tap to sign",
								}),
							],
					  })
					: "done" === j && n
					? (0, s.jsxs)("div", {
							className: `flex min-h-[120px] w-full min-w-0 max-w-full flex-col items-center justify-center gap-2 rounded-lg border border-[var(--dms-green)]/40 bg-[var(--dms-green-light)]/20 p-3 ${x}`,
							children: [
								(0, s.jsx)("img", {
									src: ((e) => {
										if (e.startsWith("http") || e.startsWith("data:"))
											return e;
										let t = window.location.origin;
										return `${t}${e.startsWith("/") ? "" : "/"}${e}`;
									})(n),
									alt: "Customer signature",
									className: "max-h-20 object-contain",
								}),
								!u &&
									(0, s.jsxs)(d.$, {
										type: "button",
										variant: "ghost",
										size: "sm",
										className: "h-8 text-xs text-muted-foreground",
										onClick: () => {
											b("drawing"), C();
										},
										children: [
											(0, s.jsx)(l.A, { className: "mr-1 h-3 w-3" }),
											"Re-sign",
										],
									}),
							],
					  })
					: (0, s.jsxs)("div", {
							ref: p,
							className: `flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-lg border bg-card ${x}`,
							children: [
								(0, s.jsxs)("div", {
									className:
										"flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2",
									children: [
										(0, s.jsxs)("span", {
											className:
												"flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground",
											children: [
												(0, s.jsx)(i.A, { className: "h-3 w-3" }),
												"Draw signature",
											],
										}),
										(0, s.jsxs)("div", {
											className:
												"ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1",
											children: [
												(0, s.jsxs)(d.$, {
													type: "button",
													variant: "ghost",
													size: "sm",
													className: "h-7 px-2 text-xs",
													onClick: C,
													disabled: !v,
													children: [
														(0, s.jsx)(l.A, {
															className: "h-3 w-3 sm:mr-1",
														}),
														(0, s.jsx)("span", {
															className: "hidden sm:inline",
															children: "Clear",
														}),
													],
												}),
												(0, s.jsx)(d.$, {
													type: "button",
													variant: "ghost",
													size: "sm",
													className: "h-7 px-2 text-xs",
													onClick: () => {
														b("idle"), C();
													},
													children: "Cancel",
												}),
												(0, s.jsxs)(d.$, {
													type: "button",
													size: "sm",
													className: "h-7 px-2 text-xs",
													onClick: () => {
														let t = h.current;
														t &&
															t.toBlob((t) => {
																t &&
																	(e(
																		new File(
																			[t],
																			`signature_${Date.now()}.png`,
																			{ type: "image/png" }
																		)
																	),
																	b("done"));
															}, "image/png");
													},
													disabled: !v,
													children: [
														(0, s.jsx)(o.A, {
															className: "h-3 w-3 sm:mr-1",
														}),
														(0, s.jsx)("span", {
															className: "hidden sm:inline",
															children: "Save",
														}),
													],
												}),
											],
										}),
									],
								}),
								(0, s.jsx)("canvas", {
									ref: h,
									className:
										"block h-36 w-full max-w-full cursor-crosshair bg-white box-border",
									style: { touchAction: "none" },
								}),
							],
					  });
			}
		},
		43447: (e, t, n) => {
			n.d(t, {
				SQ: () => o,
				_2: () => d,
				lp: () => c,
				mB: () => m,
				rI: () => i,
				ty: () => l,
			});
			var s = n(95155);
			n(12115);
			var r = n(61108),
				a = n(91337);
			function i({ ...e }) {
				return (0, s.jsx)(r.bL, { "data-slot": "dropdown-menu", ...e });
			}
			function l({ ...e }) {
				return (0, s.jsx)(r.l9, { "data-slot": "dropdown-menu-trigger", ...e });
			}
			function o({ className: e, sideOffset: t = 4, ...n }) {
				return (0, s.jsx)(r.ZL, {
					children: (0, s.jsx)(r.UC, {
						"data-slot": "dropdown-menu-content",
						sideOffset: t,
						className: (0, a.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
							e
						),
						...n,
					}),
				});
			}
			function d({ className: e, inset: t, variant: n = "default", ...i }) {
				return (0, s.jsx)(r.q7, {
					"data-slot": "dropdown-menu-item",
					"data-inset": t,
					"data-variant": n,
					className: (0, a.cn)(
						"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...i,
				});
			}
			function c({ className: e, inset: t, ...n }) {
				return (0, s.jsx)(r.JU, {
					"data-slot": "dropdown-menu-label",
					"data-inset": t,
					className: (0, a.cn)("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", e),
					...n,
				});
			}
			function m({ className: e, ...t }) {
				return (0, s.jsx)(r.wv, {
					"data-slot": "dropdown-menu-separator",
					className: (0, a.cn)("bg-border -mx-1 my-1 h-px", e),
					...t,
				});
			}
		},
		49580: (e, t, n) => {
			n.d(t, { e: () => d });
			var s = n(95155),
				r = n(12115),
				a = n(81262),
				i = n(5240),
				l = n(4474),
				o = n(43447);
			function d({
				doctype: e,
				docName: t,
				noLetterhead: n = 0,
				triggerPrint: c = 0,
				className: m,
				variant: u = "default",
			}) {
				let [x, h] = (0, r.useState)(null),
					[p, f] = (0, r.useState)(!1),
					[g, v] = (0, r.useState)(!1);
				(0, r.useEffect)(() => {
					if (!e) return void h(["Standard"]);
					let t = !1;
					return (
						(0, i.Iy)(e)
							.then((e) => {
								t || h(e.length ? e : ["Standard"]);
							})
							.catch(() => {
								t || h(["Standard"]);
							}),
						() => {
							t = !0;
						}
					);
				}, [e]);
				let w = (s) => {
						e &&
							t &&
							(function (e, t, n = "Standard", s) {
								let r = new URLSearchParams();
								r.set("doctype", e),
									r.set("name", t),
									r.set("format", n),
									r.set("trigger_print", String(s?.triggerPrint ?? 0)),
									r.set("no_letterhead", String(s?.noLetterhead ?? 0));
								let a = window.location.origin;
								window.open(
									`${a}/printview?${r.toString()}`,
									"_blank",
									"noopener,noreferrer"
								);
							})(e, t, s, { noLetterhead: n, triggerPrint: c });
					},
					j = async (n) => {
						if ((n.stopPropagation(), n.preventDefault(), !g && e && t)) {
							v(!0);
							try {
								let t = x;
								if (!t) {
									let n = await (0, i.Iy)(e);
									(t = n.length ? n : ["Standard"]), h(t);
								}
								if (t.length <= 1) return void w(t[0] || "Standard");
								f(!0);
							} catch {
								w("Standard");
							} finally {
								v(!1);
							}
						}
					},
					b = "icon" === u,
					N = {
						type: "button",
						variant: b ? "ghost" : "outline",
						size: b ? "icon" : "sm",
						className: m,
						"aria-label": "Print",
						title: "Print",
						disabled: g,
					};
				return x && x.length > 1
					? (0, s.jsxs)(o.rI, {
							open: p,
							onOpenChange: f,
							children: [
								(0, s.jsx)(o.ty, {
									asChild: !0,
									children: (0, s.jsxs)(l.$, {
										...N,
										onClick: (e) => e.stopPropagation(),
										children: [
											(0, s.jsx)(a.A, {
												className: b ? "h-4 w-4" : "h-4 w-4 mr-2",
											}),
											!b && "Print",
										],
									}),
								}),
								(0, s.jsxs)(o.SQ, {
									align: "end",
									side: "bottom",
									sideOffset: 4,
									collisionPadding: 8,
									className: "min-w-[180px] z-[9999]",
									onClick: (e) => e.stopPropagation(),
									children: [
										(0, s.jsx)(o.lp, {
											className: "text-xs font-medium text-muted-foreground",
											children: "Print format",
										}),
										(0, s.jsx)(o.mB, {}),
										x.map((e) =>
											(0, s.jsx)(
												o._2,
												{
													onSelect: () => {
														w(e), f(!1);
													},
													children: e,
												},
												e
											)
										),
									],
								}),
							],
					  })
					: (0, s.jsxs)(l.$, {
							...N,
							onClick: j,
							children: [
								(0, s.jsx)(a.A, { className: b ? "h-4 w-4" : "h-4 w-4 mr-2" }),
								!b && "Print",
							],
					  });
			}
		},
		59189: (e, t, n) => {
			n.d(t, { d: () => c });
			var s = n(95155),
				r = n(7099),
				a = n(22164),
				i = n(74350),
				l = n(4474);
			let o = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"],
				d = ["pdf"];
			function c({ open: e, onOpenChange: t, url: n, title: m }) {
				let u,
					x,
					h,
					p = (n || "").trim(),
					f = p
						? ((h =
								(x = (u =
									p.split("?")[0].split("#")[0].split("/").pop() ||
									"").lastIndexOf(".")) >= 0
									? u.slice(x + 1).toLowerCase()
									: ""),
						  o.includes(h) ? "image" : d.includes(h) ? "pdf" : "other")
						: "other";
				return (0, s.jsx)(i.lG, {
					open: e,
					onOpenChange: t,
					children: (0, s.jsxs)(i.Cf, {
						className:
							"flex h-[min(90vh,900px)] w-[min(96vw,1100px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:rounded-xl",
						children: [
							(0, s.jsxs)(i.c7, {
								className: "shrink-0 space-y-0 border-b px-4 py-3 text-left",
								children: [
									(0, s.jsx)(i.L3, {
										className: "truncate pr-8 text-base",
										children: m || "Attachment",
									}),
									(0, s.jsx)(i.rr, {
										className: "sr-only",
										children: "Attachment preview",
									}),
								],
							}),
							(0, s.jsx)("div", {
								className:
									"flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/30 p-3",
								children: p
									? "image" === f
										? (0, s.jsx)("img", {
												src: p,
												alt: m || "Attachment",
												className:
													"max-h-full max-w-full rounded-md border bg-white object-contain shadow-sm",
										  })
										: "pdf" === f
										? (0, s.jsx)("iframe", {
												title: m || "Attachment",
												src: p,
												className:
													"h-full w-full rounded-md border bg-white shadow-sm",
										  })
										: (0, s.jsxs)("div", {
												className:
													"flex flex-col items-center gap-2 text-center",
												children: [
													(0, s.jsx)(r.A, {
														className: "h-8 w-8 text-muted-foreground",
													}),
													(0, s.jsx)("p", {
														className: "text-sm text-muted-foreground",
														children:
															"This file type cannot be shown here.",
													}),
												],
										  })
									: (0, s.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: "Nothing to view.",
									  }),
							}),
							(0, s.jsxs)(i.Es, {
								className:
									"shrink-0 flex-row items-center justify-end gap-2 border-t bg-card px-4 py-3",
								children: [
									p
										? (0, s.jsx)(l.$, {
												type: "button",
												variant: "outline",
												size: "sm",
												asChild: !0,
												children: (0, s.jsxs)("a", {
													href: p,
													target: "_blank",
													rel: "noopener noreferrer",
													children: [
														(0, s.jsx)(a.A, {
															className: "mr-1.5 h-3.5 w-3.5",
														}),
														"Open in new tab",
													],
												}),
										  })
										: null,
									(0, s.jsx)(l.$, {
										type: "button",
										size: "sm",
										onClick: () => t(!1),
										children: "Close",
									}),
								],
							}),
						],
					}),
				});
			}
		},
		73158: (e, t, n) => {
			n.d(t, { m: () => u });
			var s = n(95155),
				r = n(4474);
			n(12115);
			var a = n(67198),
				i = n(91337);
			function l({ ...e }) {
				return (0, s.jsx)(a.bL, { "data-slot": "popover", ...e });
			}
			function o({ ...e }) {
				return (0, s.jsx)(a.l9, { "data-slot": "popover-trigger", ...e });
			}
			function d({ className: e, align: t = "center", sideOffset: n = 4, ...r }) {
				return (0, s.jsx)(a.ZL, {
					children: (0, s.jsx)(a.UC, {
						"data-slot": "popover-content",
						align: t,
						sideOffset: n,
						className: (0, i.cn)(
							"bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
							e
						),
						...r,
					}),
				});
			}
			var c = n(61991),
				m = n(77104);
			function u({ lines: e, title: t = "Amounts", hint: n }) {
				let a = e.find((e) => e.highlight) ?? e[e.length - 1];
				return (0, s.jsxs)(l, {
					children: [
						(0, s.jsx)(o, {
							asChild: !0,
							children: (0, s.jsxs)(r.$, {
								variant: "outline",
								size: "sm",
								className: "gap-1.5",
								title: n || a ? `${t}: ${a?.value}` : t,
								"aria-label": t,
								children: [
									(0, s.jsx)(m.A, { className: "h-4 w-4" }),
									(0, s.jsx)("span", {
										className:
											"hidden sm:inline text-xs text-muted-foreground max-w-[5rem] truncate",
										children: a?.value,
									}),
								],
							}),
						}),
						(0, s.jsxs)(d, {
							className: "w-72 p-0",
							align: "end",
							children: [
								(0, s.jsx)("div", {
									className: "px-4 py-3",
									children: (0, s.jsx)("p", {
										className: "text-sm font-medium",
										children: t,
									}),
								}),
								(0, s.jsx)(c.w, {}),
								(0, s.jsx)("div", {
									className: "space-y-2 px-4 py-3",
									children: e.map((e) =>
										(0, s.jsxs)(
											"div",
											{
												className:
													"flex items-center justify-between gap-3 text-sm",
												children: [
													(0, s.jsx)("span", {
														className: "text-muted-foreground",
														children: e.label,
													}),
													(0, s.jsx)("span", {
														className: (0, i.cn)(
															"font-medium tabular-nums",
															e.highlight &&
																"text-base font-semibold text-primary",
															e.deduction && "text-orange-600"
														),
														children: e.value,
													}),
												],
											},
											e.label
										)
									),
								}),
							],
						}),
					],
				});
			}
		},
	},
]);
