import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pdfToImages } from '@/lib/pdf';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const MEDIA_PATH = process.env.MEDIA_PATH || './media';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const artworkId = formData.get('artworkId') as string;

    if (!file || !artworkId) {
      return NextResponse.json(
        { error: 'Missing file or artworkId' },
        { status: 400 }
      );
    }

    // Validate PDF MIME type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Verify the artwork exists
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
    });

    if (!artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      );
    }

    // --- 1. Save the original PDF to media/pdfs/ ---
    const pdfDir = path.join(MEDIA_PATH, 'pdfs');
    await fs.mkdir(pdfDir, { recursive: true });

    const pdfFilename = `${crypto.randomUUID()}.pdf`;
    const pdfFullPath = path.join(pdfDir, pdfFilename);

    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    await fs.writeFile(pdfFullPath, pdfBuffer);

    // --- 2. Convert PDF pages to JPG images ---
    let pageBuffers: Buffer[];
    try {
      pageBuffers = await pdfToImages(pdfFullPath);
    } catch (error: any) {
      // Clean up the saved PDF if conversion fails
      await fs.unlink(pdfFullPath).catch(() => {});
      return NextResponse.json(
        { error: `Failed to process PDF: ${error.message}` },
        { status: 422 }
      );
    }

    if (pageBuffers.length === 0) {
      await fs.unlink(pdfFullPath).catch(() => {});
      return NextResponse.json(
        { error: 'The PDF contains no pages.' },
        { status: 422 }
      );
    }

    // --- 3. Save each JPG to media/images/ and create DB records ---
    const imagesDir = path.join(MEDIA_PATH, 'images');
    await fs.mkdir(imagesDir, { recursive: true });

    // Determine the starting order value based on existing images
    const lastImage = await prisma.image.findFirst({
      where: { artworkId },
      orderBy: { order: 'desc' },
    });
    let nextOrder = (lastImage?.order ?? -1) + 1;

    const createdImages = [];

    for (const buffer of pageBuffers) {
      const imgFilename = `${crypto.randomUUID()}.jpg`;
      const imgRelativePath = path.join('images', imgFilename).replace(/\\/g, '/');
      const imgFullPath = path.join(imagesDir, imgFilename);

      await fs.writeFile(imgFullPath, buffer);

      const image = await prisma.image.create({
        data: {
          filePath: imgRelativePath,
          artworkId,
          type: 'pdf-page',
          order: nextOrder,
        },
      });

      createdImages.push(image);
      nextOrder++;
    }

    // --- 4. Update the Artwork record with the source PDF path ---
    const pdfRelativePath = `pdfs/${pdfFilename}`;
    await prisma.artwork.update({
      where: { id: artworkId },
      data: { sourcePdf: pdfRelativePath },
    });

    return NextResponse.json({
      pdfPath: pdfRelativePath,
      pages: createdImages.length,
      images: createdImages,
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return NextResponse.json(
      { error: 'Failed to upload and process PDF' },
      { status: 500 }
    );
  }
}
