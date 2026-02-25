"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PageBasedStory } from "@/actions/library";

// Using built-in PDF fonts (Helvetica & Times-Roman) — no external font fetching needed.
// This avoids all fontkit "Unknown font format" and "Failed to fetch" errors.

const styles = StyleSheet.create({
    page: {
        padding: 0,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
    },
    // ── Cover ─────────────────────────────────────────────────────────────
    coverPage: {
        position: 'relative',
        height: '100%',
        width: '100%',
        backgroundColor: '#0c4a6e',
    },
    fullImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        objectFit: 'cover',
    },
    coverFallback: {
        position: 'absolute',
        bottom: 80,
        left: 40,
        right: 40,
        padding: 24,
        backgroundColor: 'rgba(0,0,0,0.40)',
        borderRadius: 8,
    },
    coverTitle: {
        fontSize: 38,
        color: '#ffffff',
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    coverAuthor: {
        fontSize: 16,
        color: '#e0f2fe',
        fontFamily: 'Helvetica',
        textAlign: 'center',
    },
    // ── Title / Dedication ────────────────────────────────────────────────
    titlePage: {
        padding: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        height: '100%',
    },
    accent: {
        width: 40,
        height: 4,
        backgroundColor: '#0ea5e9',
    },
    titleHeader: {
        fontSize: 30,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginTop: 24,
        marginBottom: 24,
        textAlign: 'center',
    },
    dedicationText: {
        fontSize: 15,
        fontFamily: 'Times-Italic',
        color: '#475569',
        lineHeight: 1.6,
        textAlign: 'center',
        maxWidth: 320,
    },
    // ── Story illustration page ───────────────────────────────────────────
    illustrationContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f8fafc',
    },
    illustrationImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    // ── Story text page ───────────────────────────────────────────────────
    interiorPage: {
        paddingTop: 60,
        paddingLeft: 60,
        paddingRight: 60,
        paddingBottom: 60,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    textContent: {
        fontSize: 15,
        fontFamily: 'Times-Roman',
        lineHeight: 1.85,
        color: '#1e293b',
        textAlign: 'justify',
        marginBottom: 14,
    },
    // ── End page ─────────────────────────────────────────────────────────
    endPage: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        padding: 60,
    },
    endTitle: {
        fontSize: 34,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        marginTop: 20,
        marginBottom: 8,
    },
    endSubtitle: {
        fontSize: 13,
        fontFamily: 'Times-Italic',
        color: '#64748b',
    },
    // ── Back cover ────────────────────────────────────────────────────────
    backCover: {
        height: '100%',
        backgroundColor: '#0c4a6e',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
    },
    backCoverText: {
        fontSize: 15,
        fontFamily: 'Helvetica',
        color: '#e0f2fe',
        textAlign: 'center',
        lineHeight: 1.6,
        maxWidth: 320,
        marginBottom: 40,
    },
    backCoverBrand: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#7dd3fc',
    },
    // ── Footer ───────────────────────────────────────────────────────────
    pageFooter: {
        position: 'absolute',
        bottom: 28,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    footerPageNum: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#94a3b8',
    },
});

interface StoryPDFProps {
    story: PageBasedStory;
}

export const StoryPDF = ({ story }: StoryPDFProps) => {
    // mutable counter — closure is fine inside a single render pass
    let displayNum = 1;

    const footer = (n: number) => (
        <View style={styles.pageFooter}>
            <Text style={styles.footerTitle}>{story.title}</Text>
            <Text style={styles.footerPageNum}>{n}</Text>
        </View>
    );

    return (
        <Document title={story.title} author={story.author || 'AI Storybook'}>
            {story.pages.map((page, idx) => {
                // ── Cover ─────────────────────────────────────────────
                if (page.type === 'cover') {
                    const imgSrc = page.illustrationUrl || story.coverImageUrl;
                    return (
                        <Page key={idx} size="A4" style={styles.page}>
                            <View style={styles.coverPage}>
                                {imgSrc ? (
                                    <Image src={imgSrc} style={styles.fullImage} />
                                ) : (
                                    <View style={styles.coverFallback}>
                                        <Text style={styles.coverTitle}>{story.title}</Text>
                                        {story.author && (
                                            <Text style={styles.coverAuthor}>{story.author}</Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        </Page>
                    );
                }

                // ── Title / Dedication ─────────────────────────────────
                if (page.type === 'title') {
                    const [title, dedication] = (page.text || '').split('\n\n');
                    const num = displayNum++;
                    return (
                        <Page key={idx} size="A4" style={styles.page}>
                            <View style={styles.titlePage}>
                                <View style={styles.accent} />
                                <Text style={styles.titleHeader}>{title || story.title}</Text>
                                {dedication ? (
                                    <Text style={styles.dedicationText}>{dedication}</Text>
                                ) : null}
                                <View style={[styles.accent, { marginTop: 24 }]} />
                            </View>
                            {footer(num)}
                        </Page>
                    );
                }

                // ── Story: illustration ────────────────────────────────
                if (page.type === 'story' && page.illustrationUrl) {
                    const num = displayNum++;
                    return (
                        <Page key={idx} size="A4" style={styles.page}>
                            <View style={styles.illustrationContainer}>
                                <Image src={page.illustrationUrl} style={styles.illustrationImage} />
                            </View>
                            {footer(num)}
                        </Page>
                    );
                }

                // ── Story: text ────────────────────────────────────────
                if (page.type === 'story' && page.text) {
                    const num = displayNum++;
                    return (
                        <Page key={idx} size="A4" style={styles.page}>
                            <View style={styles.interiorPage}>
                                {page.text.split('\n\n').map((para, pIdx) => (
                                    <Text key={pIdx} style={styles.textContent}>
                                        {para}
                                    </Text>
                                ))}
                            </View>
                            {footer(num)}
                        </Page>
                    );
                }

                // ── End page ───────────────────────────────────────────
                if (page.type === 'end') {
                    const num = displayNum++;
                    return (
                        <Page key={idx} size="A4" style={styles.page}>
                            <View style={styles.endPage}>
                                <View style={styles.accent} />
                                <Text style={styles.endTitle}>The End</Text>
                                <Text style={styles.endSubtitle}>Thank you for reading!</Text>
                            </View>
                            {footer(num)}
                        </Page>
                    );
                }

                // ── Back cover ─────────────────────────────────────────
                if (page.type === 'back') {
                    return (
                        <Page key={idx} size="A4" style={styles.page}>
                            <View style={styles.backCover}>
                                <View style={[styles.accent, { backgroundColor: '#7dd3fc', marginBottom: 28 }]} />
                                {page.text ? (
                                    <Text style={styles.backCoverText}>{page.text}</Text>
                                ) : null}
                                <View style={{ marginTop: 'auto' }}>
                                    <Text style={styles.backCoverBrand}>Created with AI Storybook</Text>
                                </View>
                            </View>
                        </Page>
                    );
                }

                return null;
            })}
        </Document>
    );
};
