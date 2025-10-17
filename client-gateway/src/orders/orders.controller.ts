import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ORDER_SERVICE } from 'src/ config';
import { CreateOrderDto } from './dto';

@Controller('orders')
export class OrdersController {
  
  constructor(
    @Inject(ORDER_SERVICE) private readonly orderClient: ClientProxy
  ) {}

  @Post()
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderClient.send('createOrder', createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderClient.send('findAllOrders', {});
  }

  @Get()
  findOne(@Param('id') id: string) {
    return this.orderClient.send('findOneOrder', id);
  }

  
}
