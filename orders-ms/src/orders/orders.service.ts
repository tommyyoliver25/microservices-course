import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-paginatio.dto';
import { changeOrderStatusDto } from './dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { OrderWithProducts } from './interfaces/order-with-products.interface';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('OrdersService')

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }




  async create(createOrderDto: CreateOrderDto) {

    try {
      const productIds = createOrderDto.items.map(i => i.productId);

      const products: any[] = await firstValueFrom(
        this.client.send({ cmd: 'validate_products' }, productIds)
      );

      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find( product => product.id == orderItem.productId ).price;
        return price * orderItem.quantity;
      }, 0)

      const totalItems = createOrderDto.items.reduce( (acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0 )

      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map( (orderItem) => ({
                price: products.find( product => product.id == orderItem.productId).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity
              }))
            }
          }
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          }
        }
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map( (orderItem) => ({
          ...orderItem,
          name: products.find( product => product.id == orderItem.productId ).name,
        }))
      }

    } catch(err) {
      throw new RpcException({
        message: err,
        status: HttpStatus.BAD_REQUEST
      })
    }
  }

  async findAll(paginationDto: OrderPaginationDto) {
    const totalPages = await this.order.count({
      where: {
        status: paginationDto.status
      }
    });

    const currentPage = paginationDto.page;
    const perPage = paginationDto.limit;

    return {
      data: await this.order.findMany({
        skip: ( currentPage - 1 ) * perPage,
        take: perPage,
        where: {
          status: paginationDto.status
        }
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil( totalPages / perPage ),
      }
    }
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          }
        }
      }
    });
    if( !order ) {
      throw new RpcException({ 
        status: HttpStatus.NOT_FOUND, 
        message: `Order with Id ${id} not found`
      })
    }

    const productIds = order.OrderItem.map( orderItem => orderItem.productId );
    const products: any[] = await firstValueFrom(
      this.client.send({ cmd: 'validate_products' }, productIds)
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map( orderItem => ({
        ...orderItem,
        name: products.find( product => product.id == orderItem.productId ).name,
      }) )
    }
  }

  async changeStatus(changeOrderStatusDto: changeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);
    if( order.status === status ) {
      return order;
    }

    return this.order.update({
      where: { id },
      data: {
        status: status 
      }
    })
  
  }


  async createPaymentSession(order: OrderWithProducts) {
    const paymentSession = await firstValueFrom(
      this.client.send('create.payment.session', {
        oderId: order.id,
        currency: 'usd',
        items: order.OrderItem.map( item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))
      })
    )

    return paymentSession;
  }

}
