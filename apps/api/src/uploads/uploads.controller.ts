import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

@Controller('uploads')
export class UploadsController {
  constructor(private readonly prisma: PrismaService) {}

  // Authenticated upload (global JWT guard applies). Returns the asset id.
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }
    const asset = await this.prisma.asset.create({
      data: { mimeType: file.mimetype, data: file.buffer },
    });
    return { id: asset.id };
  }

  @Public()
  @Get(':id')
  async serve(@Param('id') id: string, @Res() res: Response) {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException('Image not found');
    }
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(asset.data));
  }
}
