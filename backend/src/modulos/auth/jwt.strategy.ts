import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'axioma_super_secret_jwt_key_2026_seguro',
    });
  }

  async validate(payload: { sub: string; correo: string; rol: string }) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: {
        psicologo: true,
        paciente: true,
      },
    });

    if (!usuario || !usuario.estaActivo) {
      throw new UnauthorizedException('Usuario no autorizado o inactivo');
    }

    return usuario;
  }
}
